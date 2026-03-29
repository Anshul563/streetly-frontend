"use client";

import { Shield, Bell, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationDialog } from "@/components/NotificationDialog";
import Link from "next/link";

interface MobileHeaderProps {
  title?: string;
  showCreate?: boolean;
}

export function MobileHeader({ title = "Streetly", showCreate = true }: MobileHeaderProps) {
  return (
    <header className="md:hidden bg-background/80 backdrop-blur-md border-b border-border shadow-sm p-4 flex justify-between items-center w-full sticky top-0 z-40 transition-all duration-300">
      <Link href="/feed" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
          <Shield className="w-4 h-4 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {title === "Streetly" ? (
            <>Street<span className="text-primary">ly</span></>
          ) : (
            title
          )}
        </h1>
      </Link>
      <div className="flex gap-1 items-center">
        <NotificationDialog>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <Bell className="w-5 h-5 text-foreground" />
          </Button>
        </NotificationDialog>
        <ThemeToggle />
        {showCreate && (
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" asChild>
            <Link href="/issue/create">
              <PlusSquare className="w-5 h-5 text-foreground" />
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
