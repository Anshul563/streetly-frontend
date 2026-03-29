"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, PlusSquare, User } from "lucide-react";
import { useSession } from "@/lib/auth-client";

const NAV_ITEMS = [
  { href: "/feed", icon: Home, label: "Home" },
  { href: "/map", icon: Map, label: "Map" },
  { href: "/issue/create", icon: PlusSquare, label: "Create" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const username = (session?.user as any)?.username;

  const authRoutes = ["/login", "/register", "/onboarding", "/"];
  if (authRoutes.includes(pathname)) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border px-6 py-3 z-50 flex justify-between items-center shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const finalHref = href === "/profile" && username ? `/${username}` : href;
        const active = pathname === finalHref || (href === "/feed" && pathname === "/");
        
        return (
          <Link
            key={href}
            href={finalHref}
            className={`flex flex-col items-center gap-1 transition-all duration-200 ${
              active ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className={`w-6 h-6 ${active ? "fill-primary/10" : ""}`} />
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
