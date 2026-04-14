"use client";
import { useState } from "react";
import { signUp, signIn } from "@/lib/auth-client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function RegisterPage() {
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
      });

      if (res.error) {
        throw new Error(res.error.message);
      }

      toast.success("Account created successfully 🎉");
      window.location.href = "/login";
    } catch (err: any) {
      toast.error(
        err.message || err.response?.data?.message || "Registration failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    await signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}/feed`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-12 relative">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground hover:text-foreground"
        >
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
            <span className="text-2xl font-bold text-primary">🚧</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Create an account
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Join Streetly to start reporting and tracking civic issues
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="py-5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
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
              <p className="text-xs text-muted-foreground mt-1 text-right">
                Must be at least 8 characters
              </p>
            </div>

            <Button
              type="submit"
              className="w-full py-6 mt-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating
                  account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            onClick={handleGoogleRegister}
            className="w-full py-6 hover:bg-muted/50"
          >
            <FcGoogle className="w-5 h-5 mr-2" />
            Google
          </Button>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border pt-6 pb-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary font-semibold hover:underline"
            >
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
