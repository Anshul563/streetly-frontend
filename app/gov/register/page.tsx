"use client";
import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function GovRegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await signUp.email({
        name,
        email,
        password,
        role: "gov"
      } as any);

      if (res.error) {
        throw new Error(res.error.message);
      }

      toast.success("Government Account created! 🎉");
      window.location.href = "/gov/login";
    } catch (err: any) {
      toast.error(err.message || err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-12 relative">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
        </Button>
      </div>
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md shadow-lg border-border bg-card">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Official Portal
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Register as a Government Official
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name / Designation</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g. Inspector John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="py-5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Official Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@gov.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="py-5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="py-5"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">Must be at least 8 characters</p>
            </div>

            <Button type="submit" className="w-full py-6 mt-4" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...
                </>
              ) : (
                "Create Official Account"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border pt-6 pb-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/gov/login" className="text-primary font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
