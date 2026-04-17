"use client";

import { useEffect, useState, useRef } from "react";
import { API } from "@/lib/api";
import { authClient, useSession } from "@/lib/auth-client";
import { 
  Home, 
  MapPin, 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  LogOut,
  Settings,
  Edit
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileNav } from "@/components/MobileNav";
import { MobileHeader } from "@/components/MobileHeader";

type Issue = {
  id: number;
  title: string;
  description: string;
  category?: string;
  city: string;
  status: string;
  imageUrl?: string;
  createdAt?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToCloudinary = async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset || cloudName === "your_cloud_name_here") {
      toast.error("Cloudinary keys missing, skipping image upload");
      return "";
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      return data.secure_url || "";
    } catch (err) {
      console.error("Cloudinary upload failed", err);
      return "";
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploading(true);
      
      const imageUrl = await uploadToCloudinary(file);
      if (imageUrl) {
        try {
          await authClient.updateUser({ image: imageUrl });
          toast.success("Profile picture updated!");
          setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
           toast.error("Failed to update profile image");
        }
      } else {
        toast.error("Failed to upload image to Cloudinary");
      }
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [isPending, session, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserIssues(session.user.id);
    }
  }, [session?.user?.id]);

  const fetchUserIssues = async (userId: string | number) => {
    try {
      const res = await API.get(`/issues?userId=${userId}`);
      const sorted = res.data.sort((a: Issue, b: Issue) => b.id - a.id);
      setIssues(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingIssues(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (err) {
      toast.error("Failed to sign out");
    }
  };

  const ProfileSkeleton = () => (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center pb-20 md:pb-8">
      <MobileHeader showCreate={true} />
      <div className="w-full max-w-4xl px-4 md:px-6 mt-6 md:mt-10 space-y-8">
        <Card className="shadow-md border-border bg-card overflow-hidden">
          <Skeleton className="h-32 w-full rounded-none" />
          <div className="px-6 pb-6 relative">
            <div className="flex justify-between items-end -mt-12 mb-4">
              <Skeleton className="w-24 h-24 rounded-full border-4 border-card shrink-0" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
            </div>
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="mt-6 flex gap-6 border-t border-border pt-6">
              <Skeleton className="h-12 w-16" />
              <Skeleton className="h-12 w-16" />
              <Skeleton className="h-12 w-16" />
            </div>
          </div>
        </Card>
        <div className="space-y-6">
          <Skeleton className="h-8 w-40" />
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map(i => (
              <Card key={i} className="overflow-hidden shadow-sm border-border bg-card flex flex-col h-full">
                <div className="p-4 border-b border-border/50 bg-muted/20">
                  <Skeleton className="h-4 w-32" />
                </div>
                <CardContent className="p-5 flex-1 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <MobileNav />
    </div>
  );

  if (isPending || (!session && isPending)) {
    return <ProfileSkeleton />;
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const initial = user.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center pb-20 md:pb-8">
      
      {/* Top Navbar */}
      <MobileHeader showCreate={true} />

      <div className="w-full max-w-4xl px-4 md:px-6 mt-6 md:mt-10 space-y-8">
        
        {/* Navigation & Actions (Desktop) */}
        <div className="hidden md:flex justify-between items-center w-full">
          <div className="flex gap-4">
            <Button variant="outline" asChild className="gap-2">
              <a href="/feed">
                <Home className="w-4 h-4" />
                Back to Feed
              </a>
            </Button>
          </div>
          <ThemeToggle />
        </div>

        {/* Profile Card */}
        <Card className="shadow-md border-border bg-card overflow-hidden">
          <div className="h-32 bg-linear-to-r from-primary/30 to-primary/10 w-full"></div>
          
          <div className="px-6 pb-6 relative">
            <div className="flex justify-between items-end -mt-12 mb-4">
              <div 
                className={`group relative w-24 h-24 rounded-full border-4 border-card bg-secondary/80 flex items-center justify-center text-4xl font-bold text-secondary-foreground shadow-sm overflow-hidden ${uploading ? 'cursor-wait' : 'cursor-pointer'}`}
                onClick={() => !uploading && fileInputRef.current?.click()}
              >
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
                {user.image ? (
                  <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
                {!uploading && (
                  <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
                    <Edit className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              <input 
                 type="file" 
                 accept="image/*" 
                 className="hidden" 
                 ref={fileInputRef} 
                 onChange={handleImageChange} 
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <a href="/profile/settings">
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </a>
                </Button>
                <Button variant="destructive" size="sm" className="gap-2" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {user.name}
              </h2>
              <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                @{(user as any).username || "user"} 
                <span className="inline-block w-1 h-1 rounded-full bg-border"></span> 
                {user.email}
              </p>
            </div>
            
            <div className="mt-6 flex gap-6 border-t border-border pt-6">
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{issues.length}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Reports</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">0</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">0</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Following</p>
              </div>
            </div>
          </div>
        </Card>

        {/* User's Reports */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground border-b border-border pb-2">
            Your Reports
          </h3>
          
          {loadingIssues ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="overflow-hidden shadow-sm border-border bg-card flex flex-col h-full">
                  <div className="p-4 border-b border-border/50 bg-muted/20">
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <CardContent className="p-5 flex-1 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : issues.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center shadow-sm">
              <h3 className="text-lg font-medium mb-2">No Reports Yet</h3>
              <p className="text-muted-foreground text-sm mb-6">You haven't reported any infrastructure issues yet.</p>
              <Button asChild className="bg-primary text-primary-foreground">
                <a href="/issue/create">Report an Issue</a>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {issues.map((issue) => (
                <Card key={issue.id} className="overflow-hidden shadow-sm border-border bg-card flex flex-col h-full">
                  <div className="p-4 flex items-center justify-between border-b border-border/50 bg-muted/20">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 text-primary/70" />
                      <span className="font-medium">{issue.city}</span>
                      <span>•</span>
                      <span>{new Date(issue.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <CardContent className="p-5 flex-1 space-y-3">
                    <h4 className="text-lg font-semibold text-foreground line-clamp-1">{issue.title}</h4>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {issue.description}
                    </p>
                    
                    {issue.imageUrl && issue.imageUrl.trim() !== "" && (
                      <div className="w-full h-32 bg-muted rounded-lg overflow-hidden border border-border/50 mt-3">
                        <img 
                          src={issue.imageUrl} 
                          alt="Issue visual evidence" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 pt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-secondary-foreground uppercase tracking-wide">
                        {issue.category || 'General'}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${
                          issue.status === "unsolved"
                            ? "bg-destructive/10 text-destructive border-transparent"
                            : issue.status === "working"
                            ? "bg-amber-500/10 text-amber-500 border-transparent"
                            : "bg-emerald-500/10 text-emerald-500 border-transparent"
                        }`}
                      >
                        {issue.status}
                      </span>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="px-4 py-3 border-t border-border bg-muted/10 grid grid-cols-3 gap-1">
                    <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 h-8">
                      <Heart className="w-3.5 h-3.5" />
                      <span className="text-xs hidden sm:inline">Like</span>
                    </Button>
                    <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 h-8">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="text-xs hidden sm:inline">Discuss</span>
                    </Button>
                    <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 h-8">
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="text-xs hidden sm:inline">Share</span>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <MobileNav />
    </div>
  );
}