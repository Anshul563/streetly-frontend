"use client";
import { useState } from "react";
import { API } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Users, Lock, Globe } from "lucide-react";
import { toast } from "sonner";

type Props = {
  onClose: () => void;
  onCreated: (community: any) => void;
};

export function CreateCommunityModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"public" | "private">("public");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setLoading(true);
      const res = await API.post("/communities", { name, description, type });
      onCreated(res.data);
      toast.success(`Community "${res.data.name}" created!`);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create community");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Create Community</h2>
            <p className="text-sm text-muted-foreground">Start a new group for your community</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="comm-name">Community Name *</Label>
            <Input
              id="comm-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sector 7 Residents"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comm-desc">Description</Label>
            <Textarea
              id="comm-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this community about?"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Type Toggle */}
          <div className="space-y-1.5">
            <Label>Visibility</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("public")}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${type === "public" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
              >
                <Globe className="w-4 h-4" />
                Public
              </button>
              <button
                type="button"
                onClick={() => setType("private")}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${type === "private" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
              >
                <Lock className="w-4 h-4" />
                Private
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {type === "public"
                ? "Anyone with the link can join instantly."
                : "Members need admin approval to join."}
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
            {loading ? "Creating..." : "Create Community"}
          </Button>
        </form>
      </div>
    </div>
  );
}
