"use client";

import Link from "next/link";
import {
  TrendingUp,
  Flame,
  MapPin,
  UserPlus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type TrendingItem = {
  id: number;
  title: string;
  city?: string;
  interactions?: number;
};

type TopUser = {
  id: number;
  name: string;
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
  return (
    <aside className="hidden lg:flex flex-col gap-5 sticky top-8">

      {/* ── Trending ───────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center gap-2 border-b border-border/60">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-semibold text-sm text-foreground">Trending Near You</span>
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
                <p className="px-5 py-4 text-xs text-muted-foreground">Nothing trending yet.</p>
              )}
              {trending.map((item, i) => (
                <Link
                  key={item.id}
                  href={`/post/${item.id}`}
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
            <span className="font-semibold text-sm text-foreground">Top Contributors</span>
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
                <p className="px-5 py-4 text-xs text-muted-foreground">No contributors yet.</p>
              )}
              {topUsers.map((user, i) => {
                const av = user.image || user.avatar;
                return (
                  <div
                    key={user.id}
                    className="group flex items-center gap-3 px-5 py-3 hover:bg-accent/40 transition-colors"
                  >
                    {/* Rank badge */}
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0
                      ${i === 0 ? "bg-amber-400/20 text-amber-500" : i === 1 ? "bg-zinc-400/20 text-zinc-400" : i === 2 ? "bg-orange-700/20 text-orange-700" : "bg-muted text-muted-foreground"}`}>
                      {i + 1}
                    </span>

                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-border/60 bg-secondary">
                      {av ? (
                        <img src={av} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {(user.name || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Info */}
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

                    {/* Follow */}
                    <button className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-primary border border-primary/30 rounded-full px-2.5 py-1 hover:bg-primary hover:text-primary-foreground transition-all">
                      <UserPlus className="w-3 h-3" />
                      Follow
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────── */}
      <div className="text-[11px] text-muted-foreground/50 px-1 leading-relaxed">
        <p>© 2026 Streetly · <span className="text-muted-foreground/70">better-auth</span> & <span className="text-muted-foreground/70">Drizzle</span></p>
        <div className="flex gap-3 mt-1">
          <a href="#" className="hover:text-muted-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-muted-foreground transition-colors">Terms</a>
          <a href="#" className="hover:text-muted-foreground transition-colors">About</a>
        </div>
      </div>
    </aside>
  );
}
