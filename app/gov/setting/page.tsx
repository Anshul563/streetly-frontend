"use client";

import { useEffect, useState, useRef } from "react";
import { API } from "@/lib/api";
import { useSession, signOut } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Building2, 
  LayoutDashboard,
  FileText,
  Settings as SettingsIcon,
  Bell,
  LogOut,
  Camera,
  Loader2,
  Upload,
  CheckCircle2,
  XCircle,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function GovSettings() {
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    avatar: "",
    bio: ""
  });

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        window.location.href = "/gov/login";
        return;
      }
      if ((session.user as any).role !== "gov") {
        toast.error("Unauthorized.");
        window.location.href = "/feed";
        return;
      }
      
      setFormData({
        name: session.user.name || "",
        // @ts-ignore
        username: session.user.username || "",
        // @ts-ignore
        avatar: session.user.avatar || session.user.image || "",
        // @ts-ignore
        bio: session.user.bio || ""
      });
    }
  }, [session, isPending]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  useEffect(() => {
    const checkUser = async () => {
      if (!formData.username || formData.username === (session?.user as any)?.username) {
        setUsernameAvailable(null);
        return;
      }
      try {
        const res = await API.get(`/users/check-username?username=${formData.username}`);
        setUsernameAvailable(res.data.available);
      } catch (err) {
        setUsernameAvailable(null);
      }
    };
    
    const timeoutId = setTimeout(checkUser, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.username, session]);

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
        setFormData(prev => ({ ...prev, avatar: imageUrl }));
        toast.success("Image correctly uploaded");
      } else {
        toast.error("Failed to upload image");
      }
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.put("/users/profile", {
        name: formData.name,
        username: formData.username,
        avatar: formData.avatar,
        bio: formData.bio,
      });
      toast.success("Settings published successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to update settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/gov/login";
  };

  const GovSettingsSkeleton = () => (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 p-4">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="space-y-4 flex-1">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </aside>
      <main className="flex-1 p-6 lg:p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Card className="border-border shadow-md max-w-3xl">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-6">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </main>
    </div>
  );

  if (isPending) {
    return <GovSettingsSkeleton />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/50">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-md">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">GovConnect</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          <Button asChild variant="ghost" className="justify-start gap-3 w-full text-muted-foreground hover:text-foreground">
            <Link href="/gov/dashboard">
              <LayoutDashboard className="w-4 h-4" /> Overview
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start gap-3 w-full text-muted-foreground hover:text-foreground">
            <FileText className="w-4 h-4" /> All Issues
          </Button>
          <Button variant="ghost" className="justify-start gap-3 w-full text-muted-foreground hover:text-foreground">
            <Bell className="w-4 h-4" /> Notifications
          </Button>
          <Button asChild variant="secondary" className="justify-start gap-3 w-full font-medium">
            <Link href="/gov/setting">
              <SettingsIcon className="w-4 h-4" /> Settings
            </Link>
          </Button>
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center text-primary font-medium shrink-0">
              {formData.avatar ? <img src={formData.avatar} className="w-full h-full object-cover" /> : (session?.user?.name || "G")[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{session?.user?.name || "Official"}</p>
              <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-4 gap-2" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-border bg-card/50 flex items-center justify-between px-4 sm:px-6 backdrop-blur-sm sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="md:hidden -ml-2">
              <Link href="/gov/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <h1 className="font-semibold text-lg md:hidden">Settings</h1>
          </div>
          <ThemeToggle />
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-3xl">
            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-tight">Account Settings</h2>
              <p className="text-muted-foreground mt-1 text-sm">Manage your department's public identity.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <Card className="border-border shadow-md">
                <CardHeader className="bg-muted/10 border-b border-border/50 pb-4">
                  <CardTitle className="text-xl">Profile Configuration</CardTitle>
                  <CardDescription>
                    Your Display Name and Details are used officially across the Streetly ecosystem.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6 pt-6">
                  {/* Avatar Upload */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-border/50 pb-6 rounded-lg bg-transparent">
                    <div 
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-muted overflow-hidden flex items-center justify-center border-4 border-card shadow-sm relative group cursor-pointer shrink-0"
                      onClick={() => !uploading && fileInputRef.current?.click()}
                    >
                      {uploading ? (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center z-10 transition-all">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                      )}
                      {formData.avatar ? (
                         <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                         <Building2 className="w-10 h-10 text-muted-foreground/30" />
                      )}
                    </div>
                    <input 
                       type="file" 
                       accept="image/*" 
                       className="hidden" 
                       ref={fileInputRef} 
                       onChange={handleImageChange} 
                    />
                    <div className="space-y-2 flex-1 w-full text-center sm:text-left mt-2 sm:mt-0">
                      <Label className="text-base font-semibold">Official Seal or Logo</Label>
                      <p className="text-sm text-muted-foreground">Click the image or the button below to upload a high-quality logo directly.</p>
                      <Button type="button" variant="outline" size="sm" className="mt-3 gap-2 shadow-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        <Upload className="w-4 h-4" />
                        {uploading ? "Securing Upload..." : "Upload from Device"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-semibold text-foreground/90">Display Title</Label>
                      <Input 
                        id="name" 
                        placeholder="e.g. Mayor's Office" 
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="py-5 shadow-sm"
                      />
                    </div>

                    {/* Username (Handle) */}
                    <div className="space-y-2">
                      <Label htmlFor="username" className="font-semibold text-foreground/90">Support Handle</Label>
                      <div className="relative shadow-sm rounded-md overflow-hidden">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">@</span>
                        <Input 
                          id="username" 
                          className="pl-8 pr-12 py-5 border-border"
                          placeholder="municipal_corp" 
                          value={formData.username}
                          onChange={handleChange}
                          required
                          pattern="[A-Za-z0-9_]+"
                          title="Only letters, numbers, and underscores are allowed"
                        />
                        {usernameAvailable === true && (
                          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                        )}
                        {usernameAvailable === false && (
                          <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 flex flex-col gap-1">
                        Citizens will securely mention you globally using this.
                        {usernameAvailable === false && <span className="text-destructive font-medium">This handle is already taken.</span>}
                        {usernameAvailable === true && <span className="text-emerald-500 font-medium">Handle is available!</span>}
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="bio" className="font-semibold text-foreground/90">Department Info & Operating Hours</Label>
                    <Textarea 
                      id="bio" 
                      placeholder="e.g. The official dispatch and response unit for City Hall. Report active road hazards to us."
                      value={formData.bio}
                      onChange={handleChange}
                      className="resize-none h-28 shadow-sm"
                    />
                  </div>

                </CardContent>
              </Card>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => window.history.back()}>Discard</Button>
                <Button type="submit" className="shadow-sm px-6" disabled={loading || uploading || usernameAvailable === false}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Publish Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
