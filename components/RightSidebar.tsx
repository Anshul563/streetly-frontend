"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Flame,
  MapPin,
  UserPlus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { followUser, unfollowUser, checkIsFollowing } from "@/lib/social";
import { Skeleton } from "@/components/ui/skeleton";
import { createSlug } from "@/lib/utils";

type TrendingItem = {
  id: number;
  title: string;
  city?: string;
  interactions?: number;
};

type TopUser = {
  id: number;
  name: string;
  username?: string;
  role?: string;
  image?: string;
  avatar?: string;
  count?: number;
};

type Props = {
  trending: TrendingItem[];
  topUsers: TopUser[];
  loading?: boolean;
};

export function RightSidebar({ trending, topUsers, loading = false }: Props) {
  const { data: session } = useSession();
  const [followState, setFollowState] = useState<
    Record<number, boolean | undefined>
  >({});
  const [followLoading, setFollowLoading] = useState<Record<number, boolean>>(
    {},
  );

  useEffect(() => {
    if (!session?.user || topUsers.length === 0) return;

    const loadFollowStatuses = async () => {
      // Batch requests with fallback error handling
      const entries = await Promise.allSettled(
        topUsers.map(async (user) => {
          try {
            const res = await checkIsFollowing(user.id);
            return [user.id, !!res.data.isFollowing] as const;
          } catch (e) {
            console.error(
              `Failed to check follow status for user ${user.id}:`,
              e,
            );
            return [user.id, undefined] as const;
          }
        }),
      );

      const result: Record<number, boolean | undefined> = {};
      entries.forEach((settlement) => {
        if (settlement.status === "fulfilled") {
          const [userId, status] = settlement.value;
          result[userId] = status;
        }
      });

      setFollowState((prev) => ({ ...prev, ...result }));
    };

    loadFollowStatuses();
  }, [session?.user, topUsers]);

  const refreshFollowState = async (userId: number) => {
    try {
      const res = await checkIsFollowing(userId);
      setFollowState((prev) => ({
        ...prev,
        [userId]: !!res.data.isFollowing,
      }));
    } catch {
      setFollowState((prev) => ({ ...prev, [userId]: undefined }));
    }
  };

  const handleFollowToggle = async (user: TopUser) => {
    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    setFollowLoading((prev) => ({ ...prev, [user.id]: true }));

    try {
      let response;
      if (followState[user.id]) {
        response = await unfollowUser(user.id);
      } else {
        response = await followUser(user.id);
      }

      // Use the server response to update state (avoids cache race conditions)
      if (response?.data?.isFollowing !== undefined) {
        setFollowState((prev) => ({
          ...prev,
          [user.id]: response.data.isFollowing,
        }));
      } else {
        // Fallback: refresh from server if response doesn't include status
        await refreshFollowState(user.id);
      }
    } catch (err) {
      console.error("Follow action failed", err);
      await refreshFollowState(user.id);
    } finally {
      setFollowLoading((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  return (
    <aside className="hidden lg:flex flex-col gap-5 sticky top-8">
      {/* ── Trending ───────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center gap-2 border-b border-border/60">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-semibold text-sm text-foreground">
            Trending Near You
          </span>
        </div>

        {/* Items */}
        <div className="divide-y divide-border/40">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                <Skeleton className="w-6 h-5 shrink-0 mt-0.5 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))
          ) : (
            <>
              {trending.length === 0 && (
                <p className="px-5 py-4 text-xs text-muted-foreground">
                  Nothing trending yet.
                </p>
              )}
              {trending.map((item, i) => (
                <Link
                  key={item.id}
                  href={`/post/${createSlug(item.title)}-${item.id}`}
                  className="group flex items-start gap-3 px-5 py-3.5 hover:bg-accent/40 transition-colors"
                >
                  <span className="text-xl font-black text-muted-foreground/20 leading-none mt-0.5 w-6 tabular-nums shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2.5 mt-1">
                      {item.city && (
                        <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                          <MapPin className="w-2.5 h-2.5" />
                          {item.city}
                        </span>
                      )}
                      {item.interactions != null && (
                        <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                          <Flame className="w-2.5 h-2.5 text-orange-400" />
                          {item.interactions} supporting
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </>
          )}
        </div>

        {!loading && trending.length > 0 && (
          <div className="px-5 py-3 border-t border-border/40">
            <button className="text-xs text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
              Show all trending <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* ── Top Contributors ───────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center gap-2 border-b border-border/60">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div>
            <span className="font-semibold text-sm text-foreground">
              Top Contributors
            </span>
          </div>
        </div>

        <div className="divide-y divide-border/40">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-14 rounded-full shrink-0" />
              </div>
            ))
          ) : (
            <>
              {topUsers.length === 0 && (
                <p className="px-5 py-4 text-xs text-muted-foreground">
                  No contributors yet.
                </p>
              )}
              {topUsers.map((user) => {
                const av = user.image || user.avatar;
                const followStatus = followState[user.id];
                const isFollowing = followStatus === true;
                const isLoading = !!followLoading[user.id];
                const isPending = session?.user
                  ? followStatus === undefined
                  : false;
                const profileUrl = user.username
                  ? `/${user.username}`
                  : "/profile";
                const sessionUserId = session?.user?.id;
                const sessionUsername =
                  session && typeof session.user === "object" && session.user !== null
                    ? (session.user as { username?: string }).username
                    : undefined;
                const isSelf = Boolean(
                  sessionUserId !== undefined &&
                  (String(sessionUserId) === String(user.id) ||
                    (user.username &&
                      String(sessionUsername) === String(user.username))),
                );

                return (
                  <div
                    key={user.id}
                    className="group flex items-center gap-3 px-5 py-3 hover:bg-accent/40 transition-colors"
                  >
                    <Link
                      href={profileUrl}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-border/60 bg-secondary">
                        {av ? (
                          <img
                            src={av}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {(user.name || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {user.role === "user"
                            ? `${user.count ?? 0} issue${(user.count ?? 0) !== 1 ? "s" : ""} reported`
                            : user.role}
                        </p>
                      </div>
                    </Link>

                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => handleFollowToggle(user)}
                        disabled={isLoading || isPending}
                        className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-primary border border-primary/30 rounded-full px-2.5 py-1 hover:bg-primary hover:text-primary-foreground transition-all disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <UserPlus className="w-3 h-3" />
                        {isLoading || isPending
                          ? "Loading"
                          : isFollowing
                            ? "Following"
                            : "Follow"}
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────── */}
      <div className="text-[11px] text-muted-foreground/50 px-1 leading-relaxed">
        <p>
          © 2026 Streetly ·{" "}
          <span className="text-muted-foreground/70">better-auth</span> &{" "}
          <span className="text-muted-foreground/70">Drizzle</span>
        </p>
        <div className="flex gap-3 mt-1">
          <a href="#" className="hover:text-muted-foreground transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-muted-foreground transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-muted-foreground transition-colors">
            About
          </a>
        </div>
      </div>
    </aside>
  );
}
