"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Building2,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Clock,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  FileText,
  Settings,
  Bell,
  Search,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { createSlug } from "@/lib/utils";

type FeedItem = {
  id: number;
  title: string;
  description: string;
  category?: string;
  city?: string;
  status: string;
  imageUrl?: string;
  type?: string;
  createdAt?: string;
  user?: {
    name: string;
    username: string;
    image: string;
    avatar: string;
  };
};

export default function GovDashboard() {
  const { data: session, isPending } = useSession();
  const [issues, setIssues] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        window.location.href = "/gov/login";
        return;
      }
      if ((session.user as any).role !== "gov") {
        toast.error("Unauthorized: Government level access required.");
        window.location.href = "/feed";
        return;
      }
      fetchIssues();
    }
  }, [session, isPending]);

  const fetchIssues = async () => {
    try {
      const res = await API.get("/issues");
      const issuesOnly = res.data.filter(
        (item: FeedItem) => item.type !== "post",
      );
      const sorted = issuesOnly.sort((a: FeedItem, b: FeedItem) => b.id - a.id);
      setIssues(sorted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch issues.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      setUpdating(id);
      await API.patch(`/issues/${id}/status`, { status: newStatus });
      toast.success("Status updated to " + newStatus);
      setIssues(
        issues.map((issue) =>
          issue.id === id ? { ...issue, status: newStatus } : issue,
        ),
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    } finally {
      setUpdating(null);
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/gov/login";
  };

  const getStatusBadge = (status: string) => {
    if (status === "unsolved") {
      return (
        <Badge
          variant="outline"
          className="bg-destructive/10 text-destructive border-transparent flex items-center gap-1"
        >
          <AlertCircle className="w-3 h-3" /> Unsolved
        </Badge>
      );
    }
    if (status === "working" || status === "in-progress") {
      return (
        <Badge
          variant="outline"
          className="bg-amber-500/10 text-amber-500 border-transparent flex items-center gap-1"
        >
          <Clock className="w-3 h-3" /> In Progress
        </Badge>
      );
    }
    if (status === "resolved") {
      return (
        <Badge
          variant="outline"
          className="bg-emerald-500/10 text-emerald-500 border-transparent flex items-center gap-1"
        >
          <CheckCircle2 className="w-3 h-3" /> Resolved
        </Badge>
      );
    }
    return <Badge>{status}</Badge>;
  };

  const openIssuesCount = issues.filter((i) => i.status === "unsolved").length;
  const inProgressCount = issues.filter(
    (i) => i.status === "working" || i.status === "in-progress",
  ).length;
  const resolvedCount = issues.filter((i) => i.status === "resolved").length;

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === "all") return true;
    if (activeTab === "unsolved") return issue.status === "unsolved";
    if (activeTab === "in-progress")
      return issue.status === "working" || issue.status === "in-progress";
    if (activeTab === "resolved") return issue.status === "resolved";
    return true;
  });

  if (loading || isPending) {
    return (
      <div className="flex h-screen bg-muted/20">
        <div className="w-64 border-r hidden md:block">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="flex-1 p-8 space-y-6">
          <Skeleton className="h-12 w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl mt-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-md">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">GovConnect</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          <Button
            asChild
            variant="secondary"
            className="justify-start gap-3 w-full font-medium"
          >
            <Link href="/gov/dashboard">
              <LayoutDashboard className="w-4 h-4" /> Overview
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="justify-start gap-3 w-full text-muted-foreground hover:text-foreground"
          >
            <FileText className="w-4 h-4" /> All Issues
          </Button>
          <Button
            variant="ghost"
            className="justify-start gap-3 w-full text-muted-foreground hover:text-foreground"
          >
            <Bell className="w-4 h-4" /> Notifications
          </Button>
          <Button
            asChild
            variant="ghost"
            className="justify-start gap-3 w-full text-muted-foreground hover:text-foreground"
          >
            <Link href="/gov/setting">
              <Settings className="w-4 h-4" /> Settings
            </Link>
          </Button>
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium shrink-0">
              {(session?.user?.name || "G")[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">
                {session?.user?.name || "Official"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full mt-4 gap-2"
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-border bg-card/50 flex items-center justify-between px-4 sm:px-6 backdrop-blur-sm sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="font-semibold text-lg md:hidden">GovConnect</h1>
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search issues..."
                className="w-64 pl-9 bg-background focus-visible:ring-1 transition-all rounded-full h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ThemeToggle />
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Dashboard Overview
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Monitor and resolve civic reports across your jurisdiction.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            <Card className="shadow-sm border-border bg-card/50">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground tracking-tight">
                      Unsolved Issues
                    </p>
                    <p className="text-4xl font-bold text-foreground">
                      {openIssuesCount}
                    </p>
                  </div>
                  <div className="p-3 bg-destructive/10 text-destructive rounded-full">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border bg-card/50">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground tracking-tight">
                      In Progress
                    </p>
                    <p className="text-4xl font-bold text-foreground">
                      {inProgressCount}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border bg-card/50">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground tracking-tight">
                      Resolved
                    </p>
                    <p className="text-4xl font-bold text-foreground">
                      {resolvedCount}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-border bg-card overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
              <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                <Button
                  size="sm"
                  variant={activeTab === "all" ? "secondary" : "ghost"}
                  onClick={() => setActiveTab("all")}
                  className="rounded-md h-8 px-4"
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={activeTab === "unsolved" ? "secondary" : "ghost"}
                  onClick={() => setActiveTab("unsolved")}
                  className="rounded-md h-8 px-4"
                >
                  Unsolved
                </Button>
                <Button
                  size="sm"
                  variant={activeTab === "in-progress" ? "secondary" : "ghost"}
                  onClick={() => setActiveTab("in-progress")}
                  className="rounded-md h-8 px-4"
                >
                  In Progress
                </Button>
                <Button
                  size="sm"
                  variant={activeTab === "resolved" ? "secondary" : "ghost"}
                  onClick={() => setActiveTab("resolved")}
                  className="rounded-md h-8 px-4"
                >
                  Resolved
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Issue</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredIssues.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-muted-foreground"
                      >
                        No issues found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredIssues.map((issue) => (
                      <tr
                        key={issue.id}
                        className="bg-card hover:bg-muted/20 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {issue.imageUrl ? (
                              <img
                                src={issue.imageUrl}
                                className="w-10 h-10 rounded-md object-cover border border-border"
                                alt="Issue thumbnail"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center border border-border shrink-0">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <Link
                                href={`/post/${createSlug(issue.title)}-${issue.id}`}
                                className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-2"
                              >
                                {issue.title}
                              </Link>
                              <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2">
                                <span>{issue.city || "Unknown location"}</span>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
                                <span>
                                  @
                                  {issue.user?.username ||
                                    issue.user?.name
                                      .replace(/\s+/g, "")
                                      .toLowerCase() ||
                                    "citizen"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(issue.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                          {new Date(
                            issue.createdAt || Date.now(),
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 disabled:opacity-50"
                              >
                                {updating === issue.id ? (
                                  <Clock className="w-4 h-4 animate-pulse" />
                                ) : (
                                  <MoreHorizontal className="w-4 h-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuLabel className="text-xs">
                                Update Status
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-xs"
                                onClick={() =>
                                  updateStatus(issue.id, "unsolved")
                                }
                              >
                                <AlertCircle className="w-3 h-3 mr-2" /> Mark
                                Unsolved
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-xs"
                                onClick={() =>
                                  updateStatus(issue.id, "in-progress")
                                }
                              >
                                <Clock className="w-3 h-3 mr-2" /> Mark
                                In-Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-xs"
                                onClick={() =>
                                  updateStatus(issue.id, "resolved")
                                }
                              >
                                <CheckCircle2 className="w-3 h-3 mr-2" /> Mark
                                Resolved
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-xs" asChild>
                                <Link
                                  href={`/post/${createSlug(issue.title)}-${issue.id}`}
                                >
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
