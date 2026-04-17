"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, Lock, Users, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Community = {
  id: number;
  name: string;
  description: string | null;
  avatar: string | null;
  type: "public" | "private";
  memberCount: number;
};

export default function JoinCommunityPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [status, setStatus] = useState<"idle" | "joined" | "pending" | "already_member">("idle");

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const res = await API.get(`/communities/join/${inviteCode}`);
        setCommunity(res.data);
      } catch {
        toast.error("Invalid or expired invite link");
      } finally {
        setLoading(false);
      }
    };
    fetchCommunity();
  }, [inviteCode]);

  const handleJoin = async () => {
    if (!session?.user) {
      router.push(`/login?redirect=/join/${inviteCode}`);
      return;
    }
    try {
      setJoining(true);
      const res = await API.post(`/communities/join/${inviteCode}`);
      setStatus(res.data.status);
      if (res.data.status === "joined") {
        toast.success(`Joined ${community?.name}!`);
        setTimeout(() => router.push("/messages"), 1200);
      } else if (res.data.status === "already_member") {
        toast.info("You're already a member!");
        router.push("/messages");
      } else {
        toast.success("Join request sent! Waiting for approval.");
      }
    } catch {
      toast.error("Failed to join");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header gradient */}
          <div className="h-24 bg-linear-to-br from-primary/40 to-primary/10" />

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="flex justify-center -mt-12 mb-4">
              <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-primary/70 to-primary border-4 border-card flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {loading ? (
                  <Skeleton className="w-20 h-20 rounded-2xl" />
                ) : community?.avatar ? (
                  <img src={community.avatar} alt="" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  community?.name[0].toUpperCase()
                )}
              </div>
            </div>

            {loading ? (
              <div className="space-y-3 text-center">
                <Skeleton className="h-7 w-48 mx-auto" />
                <Skeleton className="h-4 w-64 mx-auto" />
              </div>
            ) : !community ? (
              <div className="text-center">
                <p className="text-lg font-bold text-destructive">Invalid Invite Link</p>
                <p className="text-sm text-muted-foreground mt-1">This link may have expired or is incorrect.</p>
                <Link href="/messages"><Button className="mt-4">Go to Messages</Button></Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold">{community.name}</h1>
                  {community.description && (
                    <p className="text-muted-foreground text-sm mt-1">{community.description}</p>
                  )}
                  <div className="flex items-center justify-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" /> {community.memberCount} members
                    </span>
                    <span className="flex items-center gap-1">
                      {community.type === "public" ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      {community.type === "public" ? "Public" : "Private"}
                    </span>
                  </div>
                </div>

                {status === "joined" && (
                  <div className="flex flex-col items-center gap-2 py-4 text-green-500">
                    <CheckCircle2 className="w-12 h-12" />
                    <p className="font-semibold">Joined successfully!</p>
                    <p className="text-sm text-muted-foreground">Redirecting to messages…</p>
                  </div>
                )}

                {status === "pending" && (
                  <div className="flex flex-col items-center gap-2 py-4 text-yellow-500">
                    <Clock className="w-12 h-12" />
                    <p className="font-semibold">Request sent!</p>
                    <p className="text-sm text-muted-foreground">Waiting for admin approval.</p>
                    <Link href="/messages"><Button variant="outline" className="mt-2">Go to Messages</Button></Link>
                  </div>
                )}

                {status === "idle" && (
                  <>
                    {community.type === "private" && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4 text-sm text-yellow-600 dark:text-yellow-400 flex items-start gap-2">
                        <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>This is a <strong>private community</strong>. Your request will need to be approved by an admin.</span>
                      </div>
                    )}

                    {isPending ? (
                      <Button className="w-full" disabled>Loading…</Button>
                    ) : !session?.user ? (
                      <div className="space-y-2">
                        <p className="text-center text-sm text-muted-foreground">Sign in to join this community</p>
                        <Button className="w-full" onClick={handleJoin}>Sign In to Join</Button>
                      </div>
                    ) : (
                      <Button className="w-full" onClick={handleJoin} disabled={joining}>
                        {joining ? "Joining…" : community.type === "public" ? "Join Community" : "Request to Join"}
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Powered by <span className="font-semibold text-foreground">Streetly</span>
        </p>
      </div>
    </div>
  );
}
