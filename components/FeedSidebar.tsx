"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationDialog } from "@/components/NotificationDialog";
import {
  Home,
  Map,
  PlusSquare,
  User,
  LogOut,
  Compass,
  Bell,
  Settings,
  Flame,
  Shield,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const NAV_ITEMS = [
  { href: "/feed",         icon: Home,       label: "Home" },
  { href: "/map",          icon: Map,         label: "Explore Map" },
  { href: "/issue/create", icon: PlusSquare,  label: "Create" },
  { href: "/profile",      icon: User,        label: "My Profile" },
];

type Props = {
  postsCount?: number;
};

export function FeedSidebar({ postsCount = 0 }: Props) {
  const pathname = usePathname();
  const { data: session, isPending: sessionLoading } = useSession();

  const username = (session?.user as any)?.username;
  const avatar   = session?.user?.image || (session?.user as any)?.avatar;
  const name     = session?.user?.name;

  return (
    <aside className="hidden md:flex flex-col sticky top-8 h-[calc(100vh-4rem)] gap-0 select-none">
      {/* ── Brand ────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 mb-6">
        <Link href="/feed" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-black tracking-tight text-foreground">
            Street<span className="text-primary">ly</span>
          </span>
        </Link>
        <ThemeToggle />
      </div>

      {/* ── Navigation ───────────────────────────────── */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm
                ${active
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-primary-foreground" : ""}`} />
              <span>{label}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/70" />
              )}
            </Link>
          );
        })}

        {/* Notifications */}
        <div className="mt-2">
          <NotificationDialog>
            <button className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm text-muted-foreground hover:text-foreground hover:bg-accent w-full text-left">
              <Bell className="w-[18px] h-[18px] shrink-0" />
              <span>Notifications</span>
            </button>
          </NotificationDialog>
        </div>

        {/* Quick create CTA */}
        <div className="mt-3 mx-0">
          <Link href="/issue/create">
            <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-primary/90 to-primary p-4 cursor-pointer group hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-xs leading-tight">Got something to share?</p>
                  <p className="text-white/70 text-[11px] mt-0.5">Post or report an issue</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/60 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
            </div>
          </Link>
        </div>

        {/* ── User Card ───────────────────────────────── */}
        {sessionLoading ? (
          <div className="mt-4">
            <div className="rounded-2xl border border-border bg-card p-3.5 shadow-sm">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-6 ml-auto" />
                  <Skeleton className="h-2.5 w-8 ml-auto" />
                </div>
              </div>
            </div>
          </div>
        ) : session?.user && (
          <div className="mt-4">
            <Link
              href={username ? `/${username}` : "/profile"}
              className="block group"
            >
              <div className="rounded-2xl border border-border bg-card p-3.5 hover:border-primary/30 hover:bg-accent/30 transition-all duration-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-border group-hover:ring-primary/30 transition-all">
                    {avatar ? (
                      <Image
                        src={avatar as string}
                        alt={name || "User"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base">
                        {name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-card" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate leading-tight group-hover:text-primary transition-colors">
                      {name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      @{username || "user"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">{postsCount}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Posts</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}
      </nav>

      {/* ── Footer actions ────────────────────────────── */}
      <div className="pt-4 border-t border-border space-y-1">
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/8 transition-all duration-200"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          <span>Log out</span>
        </Link>
        <p className="text-[10px] text-muted-foreground/50 px-3 pb-1">
          © 2026 Streetly
        </p>
      </div>
    </aside>
  );
}
