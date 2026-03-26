"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Hash,
  AlertCircle,
  Heart,
  MessageCircle,
  Share2,
  UserCheck,
  UserPlus,
  Calendar,
  Loader2,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type UserProfile = {
  id: number;
  name: string;
  username: string;
  bio?: string;
  image?: string;
  avatar?: string;
  role?: string;
  createdAt?: string;
  followersCount: number;
  followingCount: number;
  posts: Post[];
};

type Post = {
  id: number;
  title: string;
  description: string;
  category?: string;
  city?: string;
  status: string;
  imageUrl?: string;
  type?: string;
  images?: string[];
  tags?: string[];
  createdAt?: string;
  userId: string;
};

function MiniCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  if (!images || images.length === 0) return null;
  return (
    <div className="relative w-full overflow-hidden rounded-t-xl group">
      <img
        src={images[current]}
        alt={`Photo ${current + 1}`}
        className="w-full aspect-square object-cover"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); setCurrent((c) => (c - 1 + images.length) % images.length); }}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); setCurrent((c) => (c + 1) % images.length); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
          <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <ImageIcon className="w-2.5 h-2.5" />
            {images.length}
          </div>
        </>
      )}
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const isPost = post.type === "post";
  const images = post.images && post.images.length > 0 ? post.images : post.imageUrl ? [post.imageUrl] : [];

  return (
    <Link href={`/post/${post.id}`}>
      <Card className="overflow-hidden shadow-sm border-border bg-card hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
        {images.length > 0 ? (
          <MiniCarousel images={images} />
        ) : (
          <div className="aspect-square w-full bg-muted flex items-center justify-center rounded-t-xl">
            {isPost ? (
              <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
            ) : (
              <AlertCircle className="w-8 h-8 text-destructive/30" />
            )}
          </div>
        )}
        <CardContent className="p-3">
          {!isPost && (
            <p className="text-xs font-semibold text-foreground line-clamp-1 mb-1">{post.title}</p>
          )}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {post.description}
          </p>
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {post.tags.slice(0, 2).map((t) => (
                <span key={t} className="text-[10px] text-primary font-medium">#{t}</span>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="px-3 py-2 border-t border-border/50 flex items-center gap-2">
          {isPost ? (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Post</Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-destructive border-destructive/30 bg-destructive/5">Issue</Badge>
          )}
          {!isPost && post.status && (
            <span className={`text-[10px] font-medium ${
              post.status === "unsolved" ? "text-destructive" : post.status === "working" ? "text-amber-500" : "text-emerald-500"
            }`}>{post.status}</span>
          )}
          <span className="ml-auto text-[10px] text-muted-foreground">
            {new Date(post.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "posts" | "issues">("all");

  const isOwnProfile = session?.user && (session.user as any).username === username;

  useEffect(() => {
    if (username) fetchProfile();
  }, [username]);

  useEffect(() => {
    if (profile && session?.user) {
      checkFollow();
    }
  }, [profile, session]);

  const fetchProfile = async () => {
    try {
      const res = await API.get(`/users/${username}`);
      setProfile(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "User not found");
    } finally {
      setLoading(false);
    }
  };

  const checkFollow = async () => {
    if (!profile || !session?.user) return;
    try {
      const res = await API.get(`/follow/${profile.id}/is-following`);
      setIsFollowing(res.data.isFollowing);
    } catch {}
  };

  const handleFollow = async () => {
    if (!session?.user) {
      toast.error("Please log in to follow users");
      return;
    }
    if (!profile) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await API.delete(`/follow/${profile.id}`);
        setIsFollowing(false);
        setProfile((p) => p ? { ...p, followersCount: p.followersCount - 1 } : p);
        toast.success(`Unfollowed @${profile.username}`);
      } else {
        await API.post(`/follow/${profile.id}`, {});
        setIsFollowing(true);
        setProfile((p) => p ? { ...p, followersCount: p.followersCount + 1 } : p);
        toast.success(`Now following @${profile.username}!`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">User not found</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button asChild><Link href="/feed">Back to Feed</Link></Button>
        </div>
      </div>
    );
  }

  const avatar = profile.image || profile.avatar;
  const filteredPosts = profile.posts.filter((p) => {
    if (activeTab === "all") return true;
    if (activeTab === "posts") return p.type === "post";
    if (activeTab === "issues") return p.type !== "post";
    return true;
  });

  const issueCount = profile.posts.filter((p) => p.type !== "post").length;
  const postCount = profile.posts.filter((p) => p.type === "post").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b justify-between border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
       
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <div className="space-y-5">
          {/* Avatar + Stats row */}
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold shrink-0 border-2 border-primary/20 bg-primary/10 text-primary">
              {avatar ? (
                <img src={avatar} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                (profile.name || "A").charAt(0).toUpperCase()
              )}
            </div>

            {/* Stats */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex gap-4 md:gap-8">
                <div className="text-center">
                  <p className="text-xl font-bold text-foreground leading-tight">{profile.posts.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-foreground leading-tight">{profile.followersCount}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-foreground leading-tight">{profile.followingCount}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Following</p>
                </div>
              </div>

              {/* Follow / Edit button */}
              {isOwnProfile ? (
                <Button variant="outline" size="sm" className="w-full md:w-auto" asChild>
                  <Link href="/profile">Edit Profile</Link>
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant={isFollowing ? "outline" : "default"}
                  className={`w-full md:w-auto gap-2 ${isFollowing ? "border-primary/40 text-primary hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40" : ""}`}
                  onClick={handleFollow}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Name + Bio */}
          <div>
            <p className="font-bold text-foreground text-base">{profile.name}</p>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            {profile.bio && (
              <p className="text-sm text-foreground mt-2 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            )}
            {profile.role && profile.role !== "user" && (
              <Badge className="mt-2 capitalize">{profile.role}</Badge>
            )}
            {profile.createdAt && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                <Calendar className="w-3.5 h-3.5" />
                Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Quick stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-primary">{postCount}</p>
            <p className="text-xs text-muted-foreground">Posts Shared</p>
          </div>
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-destructive">{issueCount}</p>
            <p className="text-xs text-muted-foreground">Issues Reported</p>
          </div>
        </div>

        {/* Tab Filter */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {(["all", "posts", "issues"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-sm font-medium py-1.5 rounded-lg transition-all capitalize ${
                activeTab === tab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "all" ? `All (${profile.posts.length})` : tab === "posts" ? `Posts (${postCount})` : `Issues (${issueCount})`}
            </button>
          ))}
        </div>

        {/* Grid of posts */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Grid3X3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No {activeTab === "all" ? "content" : activeTab} yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
