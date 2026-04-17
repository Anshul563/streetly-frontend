"use client";
import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Clock } from "lucide-react";
import { toast } from "sonner";

type JoinRequest = {
  id: number;
  status: string;
  createdAt: string;
  user: { id: number; name: string; username: string; avatar: string | null; image: string | null };
};

type Props = { communityId: number; onClose: () => void };

export function JoinRequestsPanel({ communityId, onClose }: Props) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await API.get(`/communities/${communityId}/requests`);
      setRequests(res.data);
    } catch {
      toast.error("Failed to load join requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [communityId]);

  const respond = async (requestId: number, action: "approve" | "reject") => {
    try {
      await API.put(`/communities/requests/${requestId}`, { action });
      toast.success(action === "approve" ? "Member approved!" : "Request rejected");
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch {
      toast.error("Failed to respond");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">Join Requests</h2>
            <p className="text-sm text-muted-foreground">{requests.length} pending</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
              <Clock className="w-10 h-10 opacity-20" />
              <p>No pending requests</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {requests.map(req => {
                const avatar = req.user.image || req.user.avatar;
                return (
                  <div key={req.id} className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary shrink-0 flex items-center justify-center font-bold">
                      {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : req.user.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{req.user.name}</p>
                      <p className="text-xs text-muted-foreground">@{req.user.username}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="icon" variant="ghost" className="w-8 h-8 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => respond(req.id, "reject")}>
                        <X className="w-4 h-4" />
                      </Button>
                      <Button size="icon" className="w-8 h-8 bg-green-500 hover:bg-green-600" onClick={() => respond(req.id, "approve")}>
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
