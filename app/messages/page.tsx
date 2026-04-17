"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { API } from "@/lib/api";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FeedSidebar } from "@/components/FeedSidebar";

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
  createdAt: string;
};

export default function MessagesPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [typing, setTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial Data Fetch
  useEffect(() => {
    if (session?.user) {
      fetchConversations();
    }
  }, [session?.user]);

  const fetchConversations = async () => {
    try {
      const res = await API.get("/chat/conversations");
      setConversations(res.data);
      
      const convId = searchParams.get("conversationId");
      if (convId) {
        setActiveConvId(parseInt(convId));
      } else if (res.data.length > 0 && !activeConvId) {
        // Optionally select first conversation on desktop
        if (window.innerWidth > 768) {
          setActiveConvId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
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
      const res = await API.get(`/chat/${id}`);
      setMessages(res.data);
      scrollToBottom();
      
      // Notify socket that we read messages
      const socket = connectSocket();
      socket.emit("mark_read", { conversationId: id, userId: session?.user?.id });
    } catch (err) {
      console.error(err);
    }
  };

  // Socket Setup
  useEffect(() => {
    if (!session?.user) return;
    
    const socket = connectSocket();
    
    // Register user
    socket.emit("register", session.user.id);
    
    socket.on("receive_message", (message: Message) => {
      if (message.conversationId === activeConvId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
        // Mark read immediately if we are in the active conversation and didn't send it
        if (message.senderId !== Number(session.user.id)) {
            socket.emit("mark_read", { conversationId: activeConvId, userId: Number(session.user.id) });
        }
      } else {
        // Update conversation list with unread
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
    if (!inputText.trim() || !activeConvId || !session?.user) return;

    const activeConv = conversations.find(c => c.id === activeConvId);
    if (!activeConv) return;
    
    const receiverId = activeConv.otherUser.id;

    const socket = getSocket();
    socket.emit("send_message", {
      conversationId: activeConvId,
      senderId: session.user.id,
      receiverId,
      content: inputText.trim()
    });
    
    // update local latest message
    setConversations(prev => prev.map(c => 
      c.id === activeConvId ? { 
        ...c, 
        latestMessage: { content: inputText.trim(), senderId: Number(session.user.id), createdAt: new Date().toISOString() },
        updatedAt: new Date().toISOString()
      } : c
    ).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));

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
      <div className={`flex-1 flex flex-col min-w-0 border-r border-border ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
        {!activeConvId ? (
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                      <p className="wrap-break-word text-sm">{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
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
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card">
              <form onSubmit={handleSend} className="flex gap-2 relative">
                <Input
                  value={inputText}
                  onChange={handleInput}
                  placeholder="Type a message..."
                  className="rounded-full pr-12 bg-muted border-transparent focus-visible:ring-1 focus-visible:ring-primary/30"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className={`absolute right-1 top-1 w-8 h-8 rounded-full transition-all ${inputText.trim() ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground hover:bg-transparent'}`}
                  disabled={!inputText.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Sidebar (Conversations List) */}
      <div className={`w-full md:w-80 flex flex-col shrink-0 ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" asChild className="lg:hidden">
               <Link href="/feed"><ArrowLeft className="w-5 h-5" /></Link>
             </Button>
             <h1 className="text-xl font-bold">Messages</h1>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
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
                     router.push(`/messages?conversationId=${conv.id}`, { scroll: false });
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
                         {conv.latestMessage.content}
                       </p>
                     )}
                   </div>
                 </div>
               );
            })
          )}
        </div>
      </div>
    </div>
  );
}
