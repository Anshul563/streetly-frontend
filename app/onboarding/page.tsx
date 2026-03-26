"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { API } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Camera, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const { data: session } = useSession();
  
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      // @ts-ignore
      setAvatar(session.user.avatar || session.user.image || "");
    }
  }, [session]);

  const checkUsernameAvailability = async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    
    setUsernameStatus("checking");
    try {
      const res = await API.get(`/users/check-username?username=${value}`);
      if (res.data.available) {
        setUsernameStatus("available");
      } else {
        setUsernameStatus("taken");
      }
    } catch (error) {
      console.error(error);
      setUsernameStatus("idle");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus === "taken") {
      toast.error("Please choose an available username.");
      return;
    }
    
    if (username.length < 3) {
      toast.error("Username must be at least 3 characters.");
      return;
    }

    try {
      setLoading(true);
      await API.put("/users/profile", {
        name,
        username,
        avatar
      });
      
      toast.success("Profile saved successfully! 🎉");
      window.location.href = "/feed";
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-lg shadow-xl border-border bg-card">
        <CardHeader className="text-center pb-8 border-b border-border mb-6 space-y-3">
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Welcome to Streetly 🚧</CardTitle>
          <CardDescription className="text-base">Let's set up your civic profile so you can start reporting and tracking issues in your community.</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {/* Profile Picture */}
            <div className="flex flex-col items-center justify-center space-y-4 mb-8">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-background shadow-md bg-secondary flex items-center justify-center text-4xl text-secondary-foreground">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    name.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-105 transition-transform"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleImageUpload} 
                />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Add a profile picture</p>
            </div>

            {/* Email (Readonly) */}
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">Email</Label>
              <Input 
                type="email" 
                value={session?.user?.email || ""} 
                readOnly 
                className="bg-muted text-muted-foreground border-transparent focus-visible:ring-0 cursor-not-allowed py-5" 
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">Full Name</Label>
              <Input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                className="py-5"
                placeholder="Enter your full name"
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">Username</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} 
                  required 
                  className="py-5 pl-10 pr-10"
                  placeholder="choose_a_username"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">@</span>
                
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === "checking" && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />}
                  {usernameStatus === "available" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  {usernameStatus === "taken" && <XCircle className="w-5 h-5 text-destructive" />}
                </div>
              </div>
              {usernameStatus === "taken" && (
                <p className="text-xs text-destructive font-medium mt-1 pl-1">This username is already taken.</p>
              )}
              {usernameStatus === "available" && (
                <p className="text-xs text-emerald-500 font-medium mt-1 pl-1">This username is available!</p>
              )}
              <p className="text-xs text-muted-foreground mt-1 pl-1">Letters, numbers, and underscores only</p>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={loading || usernameStatus === "taken" || usernameStatus === "checking" || username.length < 3} 
              className="w-full py-6 text-lg mt-8 shadow-md rounded-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 
                  Completing setup...
                </>
              ) : "Complete Setup"}
            </Button>
            
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
