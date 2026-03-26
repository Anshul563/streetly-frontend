"use client";

import { useState } from "react";
import { API } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { ArrowLeft, Save, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  if (!isPending && session && !hasInitialized) {
    setUsername(session.user.name || "");
    setHasInitialized(true);
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.put("/users/username", { username });
      toast.success("Username updated successfully!");
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      {/* Mobile Navbar */}
      <div className="md:hidden bg-card border-b border-border shadow-sm p-4 flex justify-between items-center w-full sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/profile")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold tracking-tight text-primary">Settings</h1>
        </div>
        <ThemeToggle />
      </div>

      <div className="max-w-2xl w-full px-4 md:px-6 py-8 md:py-12">
        <div className="hidden md:flex justify-between items-center mb-8">
          <Button variant="outline" asChild className="gap-2">
            <a href="/profile">
              <ArrowLeft className="w-4 h-4" />
              Back to Profile
            </a>
          </Button>
          <ThemeToggle />
        </div>

        <Card className="shadow-sm border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <UserIcon className="w-5 h-5 text-primary" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>
              Update your account details and public username here.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleUpdate}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium leading-none">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground select-none">@</span>
                  <Input 
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    className="pl-8"
                    required
                  />
                </div>
                <p className="text-[13px] text-muted-foreground">
                  This is your public display name locally on Streetly.
                </p>
              </div>
            </CardContent>

            <CardFooter className="border-t border-border pt-6 bg-muted/20">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto gap-2">
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Settings
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
