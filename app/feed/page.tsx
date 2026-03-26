"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { connectSocket, getSocket } from "@/lib/socket";
import { likeTarget, unlikeTarget, supportTarget } from "@/lib/social";
import {
  PlusSquare,
  MapPin,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Hash,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Bell,
} from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FeedSidebar } from "@/components/FeedSidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { NotificationDialog } from "@/components/NotificationDialog";

type FeedItem = {
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
  interactions?: number;
  user?: {
    name: string;
    username: string;
    image: string;
    avatar: string;
  };
};

// Image carousel for posts with multiple images
function ImageCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  if (images.length === 0) return null;

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <div className="relative w-full aspect-video bg-muted overflow-hidden rounded-xl border border-border/50 mb-4 shadow-sm group">
      <img
        src={images[current]}
        alt={`Photo ${current + 1}`}
        className="w-full h-full object-cover transition-all duration-300"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === current ? "bg-white w-3" : "bg-white/50"
                }`}
              />
            ))}
          </div>
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <ImageIcon className="w-3 h-3" />
            {current + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
}

// Post card component
function PostCard({ item, isLiked, likeCount, onLike, onComment }: { item: FeedItem; isLiked: boolean; likeCount: number; onLike: () => Promise<void>; onComment: () => void; }) {
  const images =
    item.images && item.images.length > 0
      ? item.images
      : item.imageUrl
      ? [item.imageUrl]
      : [];

  return (
    <Card className="overflow-hidden shadow-md border-border bg-card hover:border-primary/20 transition-colors">
      {/* Author Row */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <Link href={item.user?.username ? `/${item.user.username}` : "#"} className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-primary/10 text-primary font-bold rounded-full flex items-center justify-center shrink-0 border border-primary/20 overflow-hidden">
            {item.user?.image || item.user?.avatar ? (
              <img
                src={item.user.image || item.user.avatar}
                className="object-cover w-full h-full"
                alt={item.user.name}
              />
            ) : (
              (item.user?.name || "A").charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm tracking-tight group-hover:text-primary transition-colors">
              {item.user?.name || "Anonymous Citizen"}
            </p>
            <div className="flex items-center text-xs text-muted-foreground gap-1 mt-0.5">
              {item.user?.username && (
                <>
                  <span className="text-primary/70">@{item.user.username}</span>
                  <span>•</span>
                </>
              )}
              <span>
                {new Date(item.createdAt || Date.now()).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </Link>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      <CardContent className="p-4 pt-2">
        {/* Caption — clickable to detail page */}
        <Link href={`/post/${item.id}`} className="block mb-4 group">
          <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap group-hover:text-primary/90 transition-colors line-clamp-4 cursor-pointer">
            {item.description}
          </p>
        </Link>

        {/* Image carousel */}
        {images.length > 0 && <ImageCarousel images={images} />}

        {/* Hashtags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-xs text-primary font-medium cursor-pointer hover:underline"
              >
                <Hash className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="px-4 py-3 border-t border-border bg-muted/30 flex gap-1">
        <Button
          variant={isLiked ? "secondary" : "ghost"}
          className="flex-1 gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5"
          onClick={onLike}
        >
          <Heart className="w-4 h-4" />
          <span className="text-sm">{isLiked ? "Liked" : "Like"} ({likeCount})</span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5"
          onClick={onComment}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">Comment</span>
        </Button>
        <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5">
          <Share2 className="w-4 h-4" />
          <span className="text-sm">Share</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

// Issue card component
function IssueCard({ item, isSupported, supportCount, onSupport, onComment }: { item: FeedItem; isSupported: boolean; supportCount: number; onSupport: () => Promise<void>; onComment: () => void; }) {
  return (
    <Card className="overflow-hidden shadow-md border-border bg-card hover:border-destructive/20 transition-colors">
      <div className="p-4 pb-2 flex items-center justify-between">
        <Link href={item.user?.username ? `/${item.user.username}` : "#"} className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-destructive/10 text-destructive font-bold rounded-full flex items-center justify-center shrink-0 border border-destructive/20 overflow-hidden">
            {item.user?.image || item.user?.avatar ? (
              <img
                src={item.user.image || item.user.avatar}
                className="object-cover w-full h-full"
                alt={item.user.name}
              />
            ) : (
              (item.user?.name || "A").charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm tracking-tight group-hover:text-primary transition-colors">
              {item.user?.name || "Anonymous Citizen"}
            </p>
            <div className="flex items-center text-xs text-muted-foreground gap-1 mt-0.5">
              {item.city && (
                <>
                  <MapPin className="w-3 h-3" />
                  <span>{item.city}</span>
                  <span>•</span>
                </>
              )}
              <span>
                {new Date(item.createdAt || Date.now()).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-destructive border-destructive/40 bg-destructive/5 text-[10px] gap-1">
            <AlertCircle className="w-2.5 h-2.5" />
            Issue
          </Badge>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4 pt-2">
        <Link href={`/post/${item.id}`}>
          <h3 className="text-lg font-semibold text-foreground mb-2 leading-tight hover:text-primary transition-colors cursor-pointer">
            {item.title}
          </h3>
        </Link>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">{item.description}</p>

        {item.imageUrl && item.imageUrl.trim() !== "" && (
          <div className="w-full aspect-video md:aspect-16/10 bg-muted rounded-xl overflow-hidden border border-border/50 mb-4 shadow-sm">
            <img
              src={item.imageUrl}
              alt="Issue visual evidence"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {item.category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-secondary text-secondary-foreground uppercase tracking-wider">
              {item.category}
            </span>
          )}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${
              item.status === "unsolved"
                ? "bg-destructive/10 text-destructive border-transparent"
                : item.status === "working"
                ? "bg-amber-500/10 text-amber-500 border-transparent"
                : "bg-emerald-500/10 text-emerald-500 border-transparent"
            }`}
          >
            {item.status}
          </span>
        </div>
      </CardContent>

      <CardFooter className="px-4 py-3 border-t border-border bg-muted/30 flex gap-1">
        <Button
          variant={isSupported ? "secondary" : "ghost"}
          className="flex-1 gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
          onClick={onSupport}
        >
          <Heart className="w-4 h-4" />
          <span className="text-sm">{isSupported ? "Supported" : "Support"} ({supportCount})</span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5"
          onClick={onComment}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">Comment</span>
        </Button>
        <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5">
          <Share2 className="w-4 h-4" />
          <span className="text-sm">Share</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function FeedPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [trending, setTrending] = useState<FeedItem[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "post" | "issue">("all");

  const [likedItems, setLikedItems] = useState<Record<number, boolean>>({});
  const [supportedItems, setSupportedItems] = useState<Record<number, boolean>>({});
  const [likeCount, setLikeCount] = useState<Record<number, number>>({});
  const [supportCount, setSupportCount] = useState<Record<number, number>>({});

  const userReportsCount = items.filter(
    (item) => item.userId === session?.user?.id && item.type !== "post"
  ).length;

  const userPostsCount = items.filter(
    (item) => item.userId === session?.user?.id
  ).length;

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    // @ts-ignore
    if (session?.user && !session.user.username) {
      window.location.href = "/onboarding";
    }
  }, [session]);

  const fetchAllData = async () => {
    try {
      const [issuesRes, trendingRes, topUsersRes] = await Promise.all([
        API.get("/issues"),
        API.get("/issues/trending"),
        API.get("/issues/top-contributors"),
      ]);
      const sorted = issuesRes.data.sort((a: FeedItem, b: FeedItem) => b.id - a.id);
      setItems(sorted);
      setTrending(trendingRes.data);
      setTopUsers(topUsersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const socket = connectSocket();

    const onLikeCreated = (payload: any) => {
      if (!payload?.issueId) return;
      setLikeCount((prev) => ({
        ...prev,
        [payload.issueId]: (prev[payload.issueId] || 0) + 1,
      }));
    };

    const onSupportCreated = (payload: any) => {
      if (!payload?.issueId) return;
      setSupportCount((prev) => ({
        ...prev,
        [payload.issueId]: (prev[payload.issueId] || 0) + 1,
      }));
    };

    socket.on("like.created", onLikeCreated);
    socket.on("support.created", onSupportCreated);

    return () => {
      socket.off("like.created", onLikeCreated);
      socket.off("support.created", onSupportCreated);
    };
  }, []);

  const handleLikeToggle = async (item: FeedItem) => {
    if (!session?.user) return;

    try {
      if (likedItems[item.id]) {
        await unlikeTarget(item.id, "issue");
        setLikedItems((prev) => ({ ...prev, [item.id]: false }));
        setLikeCount((prev) => ({ ...prev, [item.id]: Math.max((prev[item.id] || 1) - 1, 0) }));
      } else {
        await likeTarget(item.id, "issue");
        setLikedItems((prev) => ({ ...prev, [item.id]: true }));
        setLikeCount((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSupportToggle = async (item: FeedItem) => {
    if (!session?.user) return;

    try {
      const res = await supportTarget(item.id, "issue");
      const supported = res.data?.supported;
      setSupportedItems((prev) => ({ ...prev, [item.id]: supported }));

      setSupportCount((prev) => ({
        ...prev,
        [item.id]: supported
          ? (prev[item.id] || 0) + 1
          : Math.max((prev[item.id] || 1) - 1, 0),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentClick = (item: FeedItem) => {
    window.location.href = `/post/${item.id}`;
  };

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "post") return item.type === "post";
    if (filter === "issue") return item.type !== "post";
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      {/* Top Navbar for Mobile */}
      <div className="md:hidden bg-card border-b border-border shadow-sm p-4 flex justify-between items-center w-full sticky top-0 z-10">
        <h1 className="text-xl font-bold tracking-tight text-primary">🚧 Streetly</h1>
        <div className="flex gap-2 items-center">
          <NotificationDialog>
            <Button variant="ghost" size="sm">
              <Bell className="w-5 h-5 text-foreground" />
            </Button>
          </NotificationDialog>
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <a href="/issue/create">
              <PlusSquare className="w-5 h-5 text-foreground" />
            </a>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-4 gap-6 px-4 md:px-6 lg:px-8 py-6 md:py-8 items-start">
        {/* Left Sidebar */}
        <FeedSidebar postsCount={userPostsCount} />

        {/* Center: Feed */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          {/* Feed Header + Filter */}
          <div className="bg-card text-card-foreground border border-border rounded-xl p-4 md:p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Your Local Feed</h2>
            <div className="flex gap-2">
              {(["all", "post", "issue"] as const).map((f) => (
                <Button
                  key={f}
                  onClick={() => setFilter(f)}
                  variant={filter === f ? "secondary" : "ghost"}
                  size="sm"
                  className={`rounded-full capitalize text-sm ${
                    filter === f ? "" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === "all" ? "All" : f === "post" ? "Posts" : "Issues"}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
              <p>Loading feed...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-card text-card-foreground border border-border rounded-xl p-10 text-center shadow-sm">
              <h3 className="text-xl font-semibold mb-2">Nothing here yet!</h3>
              <p className="text-muted-foreground mb-6">
                {filter === "post"
                  ? "No posts yet. Be the first to share one!"
                  : filter === "issue"
                  ? "No issues reported. Help your community!"
                  : "The feed is empty. Be the first to post!"}
              </p>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <a href="/issue/create">Create Something</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-6 flex flex-col">
              {filteredItems.map((item) =>
                item.type === "post" ? (
                  <PostCard
                    key={item.id}
                    item={item}
                    isLiked={!!likedItems[item.id]}
                    likeCount={likeCount[item.id] || 0}
                    onLike={() => handleLikeToggle(item)}
                    onComment={() => handleCommentClick(item)}
                  />
                ) : (
                  <IssueCard
                    key={item.id}
                    item={item}
                    isSupported={!!supportedItems[item.id]}
                    supportCount={supportCount[item.id] || 0}
                    onSupport={() => handleSupportToggle(item)}
                    onComment={() => handleCommentClick(item)}
                  />
                )
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <RightSidebar trending={trending} topUsers={topUsers} />
      </div>
    </div>
  );
}
