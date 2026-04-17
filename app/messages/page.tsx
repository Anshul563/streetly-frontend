"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSession } from "@/lib/auth-client";
import { API } from "@/lib/api";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, MessageSquare, Reply, X as CloseIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FeedSidebar } from "@/components/FeedSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileNav } from "@/components/MobileNav";
import { CommunityChat } from "@/components/CommunityChat";
import { CreateCommunityModal } from "@/components/CreateCommunityModal";
import { Users, Plus } from "lucide-react";
import {
  generateAndStoreKeyPair,
  getStoredPublicKeyJwk,
  hasLocalKeyPair,
  encryptMessage,
  decryptMessage,
  isEncrypted,
  encodeConvId,
  decodeConvId,
} from "@/lib/crypto";

type Conversation = {
  id: number;
  participant1Id: number;
  participant2Id: number;
  updatedAt: string;
  otherUser: {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
    image: string | null;
    publicKey: string | null;
  };
  latestMessage?: {
    content: string;
    senderId: number;
    createdAt: string;
  };
  unreadCount: number;
};

type Message = {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  read: boolean;
  replyToId: number | null;
  createdAt: string;
};

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center h-screen bg-background text-muted-foreground">Loading messages...</div>}>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [decryptedMessages, setDecryptedMessages] = useState<Record<number, string>>({});
  const [decryptedPreviews, setDecryptedPreviews] = useState<Record<number, string>>({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [typing, setTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [e2eeReady, setE2eeReady] = useState(false);

  // Community state
  const [sidebarTab, setSidebarTab] = useState<"chats" | "communities">("chats");
  const [communities, setCommunities] = useState<any[]>([]);
  const [activeCommunityId, setActiveCommunityId] = useState<number | null>(null);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // E2EE key initialization
  useEffect(() => {
    if (!session?.user) return;
    const initKeys = async () => {
      if (!hasLocalKeyPair()) {
        await generateAndStoreKeyPair();
      }
      const publicKeyJwk = getStoredPublicKeyJwk();
      if (publicKeyJwk) {
        try {
          await API.put("/users/key", { publicKey: publicKeyJwk });
        } catch (e) {
          console.warn("[E2EE] Failed to upload public key:", e);
        }
      }
      setE2eeReady(true);
    };
    initKeys();
  }, [session?.user]);

  // 1️⃣  Immediately decode any conversationId in the URL so the chat skeleton
  //     appears right away — before fetchConversations finishes.
  useEffect(() => {
    const convToken = searchParams.get("conversationId");
    if (convToken) {
      const decoded = decodeConvId(convToken);
      if (decoded) setActiveConvId(decoded);
    }
  }, []); // run once on mount

  // 2️⃣  Load the conversation list after session is ready
  useEffect(() => {
    if (session?.user) {
      fetchConversations();
      fetchCommunities();
    }
  }, [session?.user]);

  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const res = await API.get("/chat/conversations");
      const convList: Conversation[] = res.data;
      setConversations(convList);

      // Decrypt latest message previews for each conversation in parallel
      const previews: Record<number, string> = {};
      await Promise.all(
        convList.map(async (conv) => {
          const latest = conv.latestMessage;
          if (!latest) return;
          if (!isEncrypted(latest.content)) {
            previews[conv.id] = latest.content;
            return;
          }
          if (conv.otherUser.publicKey) {
            previews[conv.id] = await decryptMessage(latest.content, conv.otherUser.publicKey);
          } else {
            previews[conv.id] = "Encrypted message";
          }
        })
      );
      setDecryptedPreviews(previews);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchCommunities = async () => {
    try {
      const res = await API.get("/communities/mine");
      setCommunities(res.data);
    } catch {}
  };

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
      // Mark as read in local state
      setConversations(prev => prev.map(c => 
        c.id === activeConvId ? { ...c, unreadCount: 0 } : c
      ));
    }
  }, [activeConvId]);

  const fetchMessages = async (id: number) => {
    try {
      setLoadingMessages(true);
      const res = await API.get(`/chat/${id}`);
      const rawMessages: Message[] = res.data;
      setMessages(rawMessages);

      // Decrypt all messages asynchronously
      const conv = conversations.find(c => c.id === id);
      if (conv) {
        const decryptMap: Record<number, string> = {};
        await Promise.all(
          rawMessages.map(async (msg) => {
            if (!isEncrypted(msg.content)) {
              decryptMap[msg.id] = msg.content;
              return;
            }
            // ECDH shared secret: ECDH(my_private, their_public)
            // This is the same whether I sent or received the message,
            // because ECDH(alice_priv, bob_pub) == ECDH(bob_priv, alice_pub).
            const sharedKeySource = conv.otherUser.publicKey;
            if (sharedKeySource) {
              decryptMap[msg.id] = await decryptMessage(msg.content, sharedKeySource);
            } else {
              decryptMap[msg.id] = "[Encrypted — partner key unavailable]";
            }
          })
        );
        setDecryptedMessages(decryptMap);
      }

      scrollToBottom();
      const socket = connectSocket();
      socket.emit("mark_read", { conversationId: id, userId: session?.user?.id });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Socket Setup
  useEffect(() => {
    if (!session?.user) return;
    
    const socket = connectSocket();
    
    // Register user
    socket.emit("register", session.user.id);
    
    socket.on("receive_message", async (message: Message) => {
      if (message.conversationId === activeConvId) {
        setMessages(prev => [...prev, message]);
        // Decrypt incoming real-time message
        const conv = conversations.find(c => c.id === activeConvId);
        if (conv && isEncrypted(message.content)) {
          // Always derive using the partner's public key — ECDH is symmetric
          const decrypted = conv.otherUser.publicKey
            ? await decryptMessage(message.content, conv.otherUser.publicKey)
            : "[Encrypted — partner key unavailable]";
          setDecryptedMessages(prev => ({ ...prev, [message.id]: decrypted }));
        } else {
          setDecryptedMessages(prev => ({ ...prev, [message.id]: message.content }));
        }
        scrollToBottom();
        if (message.senderId !== Number(session.user.id)) {
          socket.emit("mark_read", { conversationId: activeConvId, userId: Number(session.user.id) });
        }
      } else {
        fetchConversations();
      }
    });

    socket.on("new_message_notification", (message: Message) => {
       if (message.conversationId !== activeConvId) {
         fetchConversations();
       }
    });

    socket.on("user_typing", ({ senderId }) => {
      setOtherUserTyping(true);
    });

    socket.on("user_stopped_typing", ({ senderId }) => {
      setOtherUserTyping(false);
    });

    return () => {
      socket.off("receive_message");
      socket.off("new_message_notification");
      socket.off("user_typing");
      socket.off("user_stopped_typing");
    };
  }, [session?.user, activeConvId]);

  // Join/Leave room when active conversation changes
  useEffect(() => {
    if (!activeConvId || !session?.user) return;
    
    const socket = connectSocket();
    socket.emit("join_conversation", activeConvId);
    
    return () => {
      socket.emit("leave_conversation", activeConvId);
    };
  }, [activeConvId, session?.user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  let typingTimeout: NodeJS.Timeout;
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    if (!typing && activeConvId) {
      setTyping(true);
      const socket = getSocket();
      socket.emit("typing", { conversationId: activeConvId, senderId: session?.user?.id });
    }
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      setTyping(false);
      if (activeConvId) {
        const socket = getSocket();
        socket.emit("stop_typing", { conversationId: activeConvId, senderId: session?.user?.id });
      }
    }, 1500);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const plaintext = inputText.trim();
    if (!plaintext || !activeConvId || !session?.user) return;

    const activeConv = conversations.find(c => c.id === activeConvId);
    if (!activeConv) return;
    
    const receiverId = activeConv.otherUser.id;

    // Encrypt the message if recipient has a public key
    let content = plaintext;
    if (activeConv.otherUser.publicKey) {
      const encrypted = await encryptMessage(plaintext, activeConv.otherUser.publicKey);
      if (encrypted) content = encrypted;
    }

    const socket = getSocket();
    socket.emit("send_message", {
      conversationId: activeConvId,
      senderId: session.user.id,
      receiverId,
      content,
      replyToId: replyingTo?.id || null,
    });
    
    // Show plaintext locally immediately
    const tempId = Date.now();
    setDecryptedMessages(prev => ({ ...prev, [tempId]: plaintext }));
    setReplyingTo(null);

    // update local latest message preview (store encrypted content, but keep preview decrypted)
    setConversations(prev => prev.map(c => 
      c.id === activeConvId ? { 
        ...c, 
        latestMessage: { content, senderId: Number(session.user.id), createdAt: new Date().toISOString() },
        updatedAt: new Date().toISOString()
      } : c
    ).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));

    // Keep sidebar preview showing plaintext
    setDecryptedPreviews(prev => ({ ...prev, [activeConvId]: plaintext }));

    setInputText("");
    socket.emit("stop_typing", { conversationId: activeConvId, senderId: session.user.id });
    setTyping(false);
  };

  const activeConv = conversations.find(c => c.id === activeConvId);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* 1. Global Feed Sidebar */}
      <div className="hidden lg:block w-64 xl:w-72 border-r border-border shrink-0 p-4 xl:p-6 overflow-y-auto">
        <FeedSidebar />
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col min-w-0 border-r border-border ${(!activeConvId && !activeCommunityId) ? 'hidden md:flex' : 'flex'}`}>
        {activeCommunityId ? (
          <CommunityChat
            communityId={activeCommunityId}
            onBack={() => setActiveCommunityId(null)}
          />
        ) : !activeConvId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center gap-3 bg-card/50 backdrop-blur-sm shrink-0">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => {
                setActiveConvId(null);
                router.push('/messages');
              }}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary flex items-center justify-center font-bold">
                {(activeConv?.otherUser.image || activeConv?.otherUser.avatar) ? (
                   <img src={(activeConv.otherUser.image || activeConv.otherUser.avatar)!} alt="" className="w-full h-full object-cover" />
                ) : activeConv?.otherUser.name[0].toUpperCase()}
              </div>
              <div>
                <p className="font-bold">{activeConv?.otherUser.name}</p>
                <p className="text-xs text-muted-foreground">@{activeConv?.otherUser.username}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-16 md:pb-4">
              {loadingMessages ? (
                <div className="space-y-4 mt-4">
                   <div className="flex gap-2 items-end">
                     <Skeleton className="w-8 h-8 rounded-full shrink-0 bg-secondary" />
                     <Skeleton className="h-10 w-48 rounded-2xl rounded-bl-sm bg-muted" />
                   </div>
                   <div className="flex gap-2 items-end flex-row-reverse">
                     <Skeleton className="h-10 w-32 rounded-2xl rounded-br-sm bg-primary/20" />
                   </div>
                   <div className="flex gap-2 items-end">
                     <Skeleton className="w-8 h-8 rounded-full shrink-0 bg-secondary" />
                     <Skeleton className="h-16 w-64 rounded-2xl rounded-bl-sm bg-muted" />
                   </div>
                </div>
              ) : (
                <>
                  {/* E2EE Banner */}
                  <div className="flex flex-col items-center gap-1 py-3 px-4 select-none">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 bg-muted/50 rounded-full px-3 py-1.5">
                      <span>🔒</span>
                      <span>Messages are end-to-end encrypted. Only you and {activeConv?.otherUser.name} can read them.</span>
                    </div>
                  </div>

                  {messages.map((msg, i) => {
                const isMe = msg.senderId === Number(session?.user?.id);
                const showAvatar = i === messages.length - 1 || messages[i+1].senderId !== msg.senderId;
                return (
                  <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                    {!isMe && showAvatar ? (
                       <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary shrink-0 mb-1">
                         {(activeConv?.otherUser.image || activeConv?.otherUser.avatar) ? (
                           <img src={(activeConv.otherUser.image || activeConv.otherUser.avatar)!} alt="" className="w-full h-full object-cover" />
                         ) : <div className="w-full h-full flex items-center justify-center text-xs font-bold">{activeConv?.otherUser.name[0].toUpperCase()}</div>}
                       </div>
                    ) : (
                      !isMe && <div className="w-8 shrink-0"></div>
                    )}
                    
                    <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}>
                      {/* Reply Action Button (on hover) */}
                      <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${isMe ? "-left-10" : "-right-10"}`}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-muted"
                          onClick={() => {
                            setReplyingTo(msg);
                            document.querySelector<HTMLInputElement>('input[placeholder*="Type a message"]')?.focus();
                          }}
                        >
                          <Reply className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>

                      <div className={`rounded-2xl px-4 py-2 ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                        {/* Quoted Message */}
                        {msg.replyToId && (
                          <div className={`mb-1.5 p-1 rounded-md text-[10px] border-l ${isMe ? "bg-white/10 border-white/20" : "bg-black/5 border-black/10"}`}>
                            {(() => {
                              const repliedMsg = messages.find(m => m.id === msg.replyToId);
                              return repliedMsg ? (
                                <>
                                  <p className="font-bold mb-0.5 opacity-80">{repliedMsg.senderId === Number(session?.user?.id) ? "You" : activeConv?.otherUser.name}</p>
                                  <p className="opacity-70 truncate line-clamp-1">{decryptedMessages[repliedMsg.id] ?? (isEncrypted(repliedMsg.content) ? "🔒 Encrypted message" : repliedMsg.content)}</p>
                                </>
                              ) : <p className="italic opacity-50">Original message deleted</p>;
                            })()}
                          </div>
                        )}
                        <p className="wrap-break-word text-sm">{decryptedMessages[msg.id] ?? msg.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                  );
                })}
              {otherUserTyping && (
                 <div className="flex gap-2 items-end">
                   <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary shrink-0 mb-1">
                     {(activeConv?.otherUser.image || activeConv?.otherUser.avatar) ? (
                       <img src={(activeConv.otherUser.image || activeConv.otherUser.avatar)!} alt="" className="w-full h-full object-cover" />
                     ) : <div className="w-full h-full flex items-center justify-center text-xs font-bold">{activeConv?.otherUser.name[0].toUpperCase()}</div>}
                   </div>
                   <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                     <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce"></span>
                     <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                     <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                   </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card shrink-0">
              {/* Reply Preview */}
              {replyingTo && (
                <div className="mb-3 p-3 bg-muted/50 rounded-xl border border-border flex items-center justify-between animate-in slide-in-from-bottom-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">
                      Replying to {replyingTo.senderId === Number(session?.user?.id) ? "yourself" : activeConv?.otherUser.name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {decryptedMessages[replyingTo.id] ?? (isEncrypted(replyingTo.content) ? "🔒 Encrypted message" : replyingTo.content)}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full ml-2" onClick={() => setReplyingTo(null)}>
                    <CloseIcon className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <Input
                  value={inputText}
                  onChange={handleInput}
                  placeholder="Type a message..."
                  className=""
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  
                  disabled={!inputText.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Sidebar (Conversations / Communities) */}
      <div className={`w-full md:w-80 flex flex-col shrink-0 ${(activeConvId || activeCommunityId) ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" asChild className="lg:hidden">
               <Link href="/feed"><ArrowLeft className="w-5 h-5" /></Link>
             </Button>
             <h1 className="text-xl font-bold">Messages</h1>
          </div>
          <div className="flex items-center gap-1">
            {sidebarTab === "communities" && (
              <Button variant="ghost" size="icon" onClick={() => setShowCreateCommunity(true)}>
                <Plus className="w-4 h-4" />
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setSidebarTab("chats")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              sidebarTab === "chats" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Chats
          </button>
          <button
            onClick={() => setSidebarTab("communities")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              sidebarTab === "communities" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Communities
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {/* ── Chats Tab ── */}
          {sidebarTab === "chats" && (<>
          {loadingConversations ? (
            <div className="p-4 space-y-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
              <p>No messages yet.</p>
            </div>
          ) : (
            conversations.map(conv => {
               const avatar = conv.otherUser.image || conv.otherUser.avatar;
               return (
                 <div 
                   key={conv.id} 
                   className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-3 ${activeConvId === conv.id ? 'bg-muted/80' : ''}`}
                   onClick={() => {
                     setActiveConvId(conv.id);
                     setActiveCommunityId(null);
                     router.push(`/messages?conversationId=${encodeConvId(conv.id)}`, { scroll: false });
                   }}
                 >
                   <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-secondary flex items-center justify-center font-bold relative">
                     {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : conv.otherUser.name[0].toUpperCase()}
                     {conv.unreadCount > 0 && (
                       <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-primary border-2 border-background rounded-full"></span>
                     )}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-baseline mb-0.5">
                       <p className="font-semibold truncate">{conv.otherUser.name}</p>
                       {conv.latestMessage && (
                         <span className="text-xs text-muted-foreground shrink-0 ml-2">
                           {new Date(conv.latestMessage.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                         </span>
                       )}
                     </div>
                     {conv.latestMessage && (
                       <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                         {conv.latestMessage.senderId === Number(session?.user?.id) ? 'You: ' : ''}
                         {decryptedPreviews[conv.id] ?? (isEncrypted(conv.latestMessage.content) ? '🔒 Encrypted message' : conv.latestMessage.content)}
                       </p>
                     )}
                   </div>
                 </div>
               );
            })
          )}
          </>)}

          {/* ── Communities Tab ── */}
          {sidebarTab === "communities" && (
            communities.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <Users className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">No communities yet.</p>
                <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={() => setShowCreateCommunity(true)}>
                  <Plus className="w-3.5 h-3.5" /> Create one
                </Button>
              </div>
            ) : (
              communities.map(({ community, role }) => (
                <div
                  key={community.id}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-3 ${
                    activeCommunityId === community.id ? "bg-muted/80" : ""
                  }`}
                  onClick={() => {
                    setActiveCommunityId(community.id);
                    setActiveConvId(null);
                    router.push('/messages', { scroll: false });
                  }}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-linear-to-br from-primary/50 to-primary flex items-center justify-center text-white font-bold text-lg">
                    {community.avatar ? <img src={community.avatar} alt="" className="w-full h-full object-cover" /> : community.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold truncate">{community.name}</p>
                      {role === "admin" && <span className="text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-medium shrink-0">Admin</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{community.description || (community.type === "private" ? "🔒 Private" : "🌐 Public")}</p>
                  </div>
                </div>
              ))
            )
          )}
        </div>
        <MobileNav />
      </div>

      {showCreateCommunity && (
        <CreateCommunityModal
          onClose={() => setShowCreateCommunity(false)}
          onCreated={(newComm) => setCommunities(prev => [{ community: newComm, role: "admin" }, ...prev])}
        />
      )}
    </div>
  );
}
