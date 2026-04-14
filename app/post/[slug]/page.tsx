"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import {
  likeTarget,
  unlikeTarget,
  supportTarget,
  getComments,
  addComment,
} from "@/lib/social";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Hash,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type PostDetail = {
  id: number;
  title: string;
  description: string;
  category?: string;
  city?: string;
  address?: string;
  locality?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  imageUrl?: string;
  type?: string;
  images?: string[];
  tags?: string[];
  createdAt?: string;
  userId: string;
  user?: {
    name: string;
    username: string;
    image: string;
    avatar: string;
    bio?: string;
  };
};

function ImageCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  if (!images || images.length === 0) return null;

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <div className="relative w-full bg-black overflow-hidden rounded-2xl group">
      <img
        src={images[current]}
        alt={`Photo ${current + 1}`}
        className="w-full max-h-[520px] object-contain transition-all duration-300"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-200 ${
                  i === current
                    ? "bg-white w-5 h-1.5"
                    : "bg-white/50 w-1.5 h-1.5"
                }`}
              />
            ))}
          </div>
          {/* Counter */}
          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
            <ImageIcon className="w-3 h-3" />
            {current + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}

export default function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const postId = slug ? slug.split("-").pop() : "";
  const router = useRouter();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isLiked, setIsLiked] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [supportCount, setSupportCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (postId && !isNaN(Number(postId))) {
      fetchPost();
      fetchComments();
    } else if (postId) {
      setError("Invalid post URL");
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    const socket = connectSocket();

    const onLikeCreated = (payload: any) => {
      if (payload?.issueId !== Number(postId)) return;
      setLikeCount((p) => p + 1);
    };

    const onSupportCreated = (payload: any) => {
      if (payload?.issueId !== Number(postId)) return;
      setSupportCount((p) => p + 1);
    };

    const onCommentCreated = (payload: any) => {
      if (payload?.issueId !== Number(postId)) return;
      setComments((prev) => [payload.comment, ...prev]);
    };

    socket.on("like.created", onLikeCreated);
    socket.on("support.created", onSupportCreated);
    socket.on("comment.created", onCommentCreated);

    return () => {
      socket.off("like.created", onLikeCreated);
      socket.off("support.created", onSupportCreated);
      socket.off("comment.created", onCommentCreated);
    };
  }, [postId]);

  const fetchPost = async () => {
    try {
      const res = await API.get(`/issues/${postId}`);
      setPost(res.data);

      const interactionsRes = await API.get(`/issues/${postId}/interactions`);
      setLikeCount(interactionsRes.data.likes || 0);
      setSupportCount(interactionsRes.data.supporters || 0);
      setIsLiked(interactionsRes.data.userLiked || false);
      setIsSupported(interactionsRes.data.userSupported || false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Post not found");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await getComments(Number(postId));
      setComments(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async () => {
    if (!postId) return;
    setActionLoading(true);
    try {
      if (isLiked) {
        await unlikeTarget(Number(postId), "issue");
        setIsLiked(false);
        setLikeCount((p) => Math.max(p - 1, 0));
      } else {
        await likeTarget(Number(postId), "issue");
        setIsLiked(true);
        setLikeCount((p) => p + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSupport = async () => {
    if (!postId) return;
    setActionLoading(true);
    try {
      const res = await supportTarget(Number(postId), "issue");
      const supported = res.data?.supported;
      setIsSupported(supported);
      setSupportCount((p) => (supported ? p + 1 : Math.max(p - 1, 0)));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!postId || commentText.trim().length === 0) return;
    setCommentLoading(true);
    try {
      const res = await addComment(Number(postId), commentText);
      setComments((prev) => [res.data.comment, ...prev]);
      setCommentText("");
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  const isPost = post?.type === "post";
  const images =
    post?.images && post.images.length > 0
      ? post.images
      : post?.imageUrl
        ? [post.imageUrl]
        : [];

  const avatar = post?.user?.image || post?.user?.avatar;

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
          <Skeleton className="h-4 w-24 flex-1" />
          <Skeleton className="h-6 w-16 rounded-full shrink-0" />
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Author row */}
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>

          {/* Content lines */}
          <div className="space-y-2">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          {/* Image */}
          <Skeleton className="w-full aspect-video rounded-2xl" />

          <Separator />

          {/* Action buttons */}
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
          </div>

          {/* Comments */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <div className="space-y-2 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-border rounded-xl p-3 space-y-2"
                >
                  <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-3 w-5/6" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">
            Post not found
          </h2>
          <p className="text-muted-foreground">{error}</p>
          <Button asChild>
            <Link href="/feed">Back to Feed</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground truncate text-sm">
            {isPost ? "Post" : "Issue Report"}
          </h1>
        </div>
        {!isPost && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              post.status === "unsolved"
                ? "bg-destructive/10 text-destructive border-destructive/30"
                : post.status === "working"
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                  : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
            }`}
          >
            {post.status}
          </span>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 mb-16 md:mb-0">
        {/* Author Card */}
        <Link
          href={post.user?.username ? `/${post.user.username}` : "#"}
          className="flex items-center gap-4 group"
        >
          <div
            className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-lg font-bold shrink-0 border ${
              isPost
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={post.user?.name}
                className="w-full h-full object-cover"
              />
            ) : (
              (post.user?.name || "A").charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {post.user?.name || "Anonymous"}
            </p>
            {post.user?.username && (
              <p className="text-sm text-muted-foreground">
                @{post.user.username}
              </p>
            )}
            {post.user?.bio && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {post.user.bio}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(post.createdAt || Date.now()).toLocaleDateString(
              "en-US",
              {
                month: "long",
                day: "numeric",
                year: "numeric",
              },
            )}
          </div>
        </Link>

        {/* POST specific content */}
        {isPost && (
          <>
            {/* Caption */}
            <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap">
              {post.description}
            </p>

            {/* Hashtags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-sm text-primary font-medium cursor-pointer hover:underline"
                  >
                    <Hash className="w-3.5 h-3.5" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Images */}
            {images.length > 0 && <ImageCarousel images={images} />}

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`thumb ${i + 1}`}
                    className="w-16 h-16 object-cover rounded-lg shrink-0 border border-border cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ISSUE specific content */}
        {!isPost && (
          <>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="text-destructive border-destructive/40 bg-destructive/5 gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  Issue Report
                </Badge>
                {post.category && (
                  <Badge
                    variant="secondary"
                    className="uppercase text-xs tracking-wider"
                  >
                    {post.category}
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                {post.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {post.description}
              </p>
            </div>

            {/* Issue image */}
            {images.length > 0 && (
              <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
                <img
                  src={images[0]}
                  alt="Issue evidence"
                  className="w-full max-h-[420px] object-cover"
                />
              </div>
            )}

            {/* Location card */}
            {(post.city || post.address) && (
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                    <MapPin className="w-4 h-4 text-destructive" />
                    Location Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-4 space-y-1.5 text-sm">
                  {post.address && (
                    <p className="text-foreground font-medium">
                      {post.address}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                    {post.locality && <span>{post.locality}</span>}
                    {post.city && <span>{post.city}</span>}
                    {post.pincode && (
                      <span className="font-mono">{post.pincode}</span>
                    )}
                  </div>
                  {post.latitude && post.longitude && (
                    <a
                      href={`https://maps.google.com/?q=${post.latitude},${post.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1 font-medium"
                    >
                      <MapPin className="w-3 h-3" />
                      Open in Google Maps
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Separator />

        {/* Action Bar */}
        <div className="flex gap-2">
          <Button
            variant={
              isPost
                ? isLiked
                  ? "secondary"
                  : "outline"
                : isSupported
                  ? "secondary"
                  : "outline"
            }
            className={`flex-1 gap-2 text-sm ${
              isPost
                ? "hover:text-primary hover:border-primary/40 hover:bg-primary/5"
                : "hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5"
            }`}
            onClick={isPost ? handleLike : handleSupport}
            disabled={actionLoading}
          >
            <Heart className="w-4 h-4" />
            <span>
              {isPost
                ? isLiked
                  ? "Liked"
                  : "Like"
                : isSupported
                  ? "Supported"
                  : "Support"}
            </span>
            <span className="text-xs">{isPost ? likeCount : supportCount}</span>
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 text-sm hover:text-primary hover:border-primary/40 hover:bg-primary/5"
            onClick={() => document.getElementById("comment-input")?.focus()}
          >
            <MessageCircle className="w-4 h-4" />
            Comment
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 text-sm hover:text-primary hover:border-primary/40 hover:bg-primary/5"
            onClick={() => navigator.clipboard.writeText(window.location.href)}
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>

        {/* Comments placeholder */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground text-base">Comments</h3>
          <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3 border border-border">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <input
              id="comment-input"
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
            />
            <Button onClick={handleCommentSubmit} disabled={commentLoading}>
              Post
            </Button>
          </div>

          {comments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-2">
              {comments.map((comment) => (
                <Card key={comment.id} className="border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">
                      {comment.user?.name || "Anonymous"}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(
                        comment.createdAt || Date.now(),
                      ).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-1">
                    {comment.content}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
