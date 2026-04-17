"use client";
import { useEffect, useRef, useState } from "react";
import { API } from "@/lib/api";
import { connectSocket, getSocket } from "@/lib/socket";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, QrCode, Users, Settings, Lock, Globe, ShieldCheck, LogOut, Reply, X as CloseIcon } from "lucide-react";
import { CommunityQRModal } from "@/components/CommunityQRModal";
import { JoinRequestsPanel } from "@/components/JoinRequestsPanel";
import { toast } from "sonner";

type CommunityMessage = {
  id: number;
  communityId: number;
  content: string;
  replyToId: number | null;
  sender: { id: number; name: string; username: string; avatar: string | null; image: string | null };
  createdAt: string;
};

type Community = {
  id: number;
  name: string;
  description: string | null;
  avatar: string | null;
  type: "public" | "private";
  ownerId: number;
  inviteCode: string;
  members: Array<{ id: number; name: string; username: string; avatar: string | null; image: string | null; role: string }>;
  myRole: string;
};

type Props = {
  communityId: number;
  onBack: () => void;
};

export function CommunityChat({ communityId, onBack }: Props) {
  const { data: session } = useSession();
  const [community, setCommunity] = useState<Community | null>(null);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [inputText, setInputText] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [replyingTo, setReplyingTo] = useState<CommunityMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);

  // Load community info + messages
  useEffect(() => {
    if (!communityId) return;
    const load = async () => {
      try {
        setLoadingMessages(true);
        const [commRes, msgRes] = await Promise.all([
          API.get(`/communities/${communityId}`),
          API.get(`/communities/${communityId}/messages`),
        ]);
        setCommunity(commRes.data);
        setMessages(msgRes.data);
        scrollToBottom();
      } catch {
        toast.error("Failed to load community");
      } finally {
        setLoadingMessages(false);
      }
    };
    load();
  }, [communityId]);

  // Socket room
  useEffect(() => {
    if (!session?.user || !communityId) return;
    const socket = connectSocket();
    socket.emit("join_community_room", communityId);
    socket.on("receive_community_message", (msg: CommunityMessage) => {
      if (msg.communityId === communityId) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      }
    });
    socket.on("new_join_request", () => {
      toast.info("New join request received");
    });
    return () => {
      socket.emit("leave_community_room", communityId);
      socket.off("receive_community_message");
      socket.off("new_join_request");
    };
  }, [session?.user, communityId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !session?.user) return;
    const socket = getSocket();
    socket.emit("send_community_message", {
      communityId,
      senderId: session.user.id,
      content: text,
      replyToId: replyingTo?.id || null,
    });
    setInputText("");
    setReplyingTo(null);
  };

  const handleLeave = async () => {
    if (!confirm("Leave this community?")) return;
    try {
      await API.delete(`/communities/${communityId}/members/${session?.user?.id}`);
      toast.success("Left community");
      onBack();
    } catch {
      toast.error("Failed to leave");
    }
  };

  if (!community) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-3 bg-card/50">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1,2,3].map(i=><Skeleton key={i} className="h-10 w-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const isAdmin = community.myRole === "admin";

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3 bg-card/50 backdrop-blur-sm shrink-0">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-10 h-10 rounded-full overflow-hidden bg-linear-to-br from-primary/60 to-primary shrink-0 flex items-center justify-center text-white font-bold">
          {community.avatar ? <img src={community.avatar} alt="" className="w-full h-full object-cover" /> : community.name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold truncate">{community.name}</p>
            {community.type === "private" ? <Lock className="w-3 h-3 text-muted-foreground shrink-0" /> : <Globe className="w-3 h-3 text-muted-foreground shrink-0" />}
          </div>
          <button onClick={() => setShowMembers(!showMembers)} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
            <Users className="w-3 h-3" /> {community.members.length} members
          </button>
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Button variant="ghost" size="icon" onClick={() => setShowRequests(true)} className="relative">
              <ShieldCheck className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setShowQR(true)}>
            <QrCode className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLeave} className="text-red-500 hover:text-red-400 hover:bg-red-500/10">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Members panel (slide-over style) */}
      {showMembers && (
        <div className="border-b border-border bg-muted/30 px-4 py-3 flex flex-wrap gap-2">
          {community.members.map(m => {
            const av = m.image || m.avatar;
            return (
              <div key={m.id} className="flex items-center gap-1.5 bg-background border border-border rounded-full px-2 py-1">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-secondary shrink-0 flex items-center justify-center text-[10px] font-bold">
                  {av ? <img src={av} alt="" className="w-full h-full object-cover" /> : m.name[0]}
                </div>
                <span className="text-xs font-medium">{m.name}</span>
                {m.role === "admin" && <span className="text-[10px] text-primary font-semibold">Admin</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Banner */}
        <div className="flex justify-center">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 bg-muted/50 rounded-full px-3 py-1.5">
            <Users className="w-3 h-3" />
            <span>{community.name} · Community messages are not end-to-end encrypted</span>
          </div>
        </div>

        {loadingMessages ? (
          <div className="space-y-4">
            {[1,2,3].map(i=>(
              <div key={i} className={`flex gap-2 items-end ${i%2===0?'flex-row-reverse':''}`}>
                <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                <Skeleton className={`h-10 rounded-2xl ${i%2===0?'w-40':'w-56'}`} />
              </div>
            ))}
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender.id === Number(session?.user?.id);
            const showAvatar = i === 0 || messages[i-1].sender.id !== msg.sender.id;
            const senderAv = msg.sender.image || msg.sender.avatar;
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} items-end`}>
                {!isMe && (showAvatar ? (
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-secondary shrink-0 flex items-center justify-center text-xs font-bold">
                    {senderAv ? <img src={senderAv} alt="" className="w-full h-full object-cover" /> : msg.sender.name[0]}
                  </div>
                ) : <div className="w-7 shrink-0" />)}
                <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col group relative`}>
                  {!isMe && showAvatar && (
                    <span className="text-[10px] text-muted-foreground mb-0.5 ml-1">{msg.sender.name}</span>
                  )}
                  
                  {/* Reply Action Button (on hover) */}
                  <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${isMe ? "-left-10" : "-right-10"}`}>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full hover:bg-muted"
                      onClick={() => {
                        setReplyingTo(msg);
                        // Focus input
                        document.querySelector<HTMLInputElement>('input[placeholder*="Message"]')?.focus();
                      }}
                    >
                      <Reply className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>

                  <div className={`rounded-2xl px-4 py-2 ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                    {/* Quoted Message */}
                    {msg.replyToId && (
                      <div className={`mb-1.5 p-1 rounded-md text-[10px] border-l ${isMe ? "bg-white/10 border-white/20" : "bg-black/5 border-black/10"}`}>
                        {(() => {
                          const repliedMsg = messages.find(m => m.id === msg.replyToId);
                          return repliedMsg ? (
                            <>
                              <p className="font-bold mb-0.5 opacity-80">{repliedMsg.sender.name}</p>
                              <p className="opacity-70 truncate line-clamp-1">{repliedMsg.content}</p>
                            </>
                          ) : <p className="italic opacity-50">Original message deleted</p>;
                        })()}
                      </div>
                    )}
                    <p className="text-sm wrap-break-word">{msg.content}</p>
                    <p className={`text-[10px] mt-0.5 text-right ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card shrink-0">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="mb-3 p-3 bg-muted/50 rounded-xl border border-border flex items-center justify-between animate-in slide-in-from-bottom-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">Replying to {replyingTo.sender.name}</p>
              <p className="text-sm text-muted-foreground truncate">{replyingTo.content}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full ml-2" onClick={() => setReplyingTo(null)}>
              <CloseIcon className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${community.name}…`}
          />
          <Button type="submit" size="icon" disabled={!inputText.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {showQR && <CommunityQRModal community={community} onClose={() => setShowQR(false)} />}
      {showRequests && <JoinRequestsPanel communityId={communityId} onClose={() => setShowRequests(false)} />}
    </div>
  );
}
