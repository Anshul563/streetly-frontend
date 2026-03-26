import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { MapIcon, MessageSquareHeart, ShieldAlert, ArrowRight, Activity, MapPin, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tighter text-primary">🚧 Streetly</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="rounded-full shadow-sm">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative px-4 py-24 md:py-32 flex flex-col items-center justify-center text-center max-w-5xl mx-auto w-full">
          <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
          
          <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-medium mb-8">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            Empowering communities everywhere
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Fix your city, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60">
              together.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl text-balance">
            Streetly is the community-driven platform for reporting civic issues. From potholes to broken streetlights, track real-time resolution and make your neighborhood better.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button size="lg" className="rounded-full h-14 px-8 text-base shadow-lg transition-transform hover:scale-105" asChild>
              <Link href="/register">
                Start Reporting <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-base bg-background/50 backdrop-blur" asChild>
              <Link href="/map">
                Explore the Map
              </Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/30 py-24 px-4 border-t border-border">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">How Streetly Works</h2>
              <p className="text-muted-foreground text-lg">A simple process to drive real change in your community.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-card p-8 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Report Issues</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Spot a broken streetlight or a huge pothole? Snap a picture, tag the location, and alert your community instantly.
                </p>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-card p-8 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                  <MessageSquareHeart className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Gather Support</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Fellow citizens can upvote and comment on issues, raising visibility and prioritizing the most critical problems.
                </p>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-card p-8 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                  <Activity className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Track Progress</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Watch the status change from 'Unsolved' to 'Resolved'. See real-world impact and track the history of your neighborhood.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Stats / Social Proof */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-primary text-primary-foreground rounded-[2.5rem] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-10">
                <MapIcon className="w-96 h-96" />
              </div>
              
              <div className="relative z-10 max-w-xl">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Join the movement.</h2>
                <p className="text-primary-foreground/80 text-lg md:text-xl mb-8 opacity-90 leading-relaxed">
                  Every report is a step towards a safer, cleaner, and better city. Join thousands of active citizens tracking civic infrastructure daily.
                </p>
                <Button variant="secondary" size="lg" className="rounded-full h-14 px-8 text-base shadow-sm" asChild>
                  <Link href="/register">Create an Account free</Link>
                </Button>
              </div>
              
              <div className="relative z-10 grid grid-cols-2 gap-6 w-full md:w-auto">
                <div className="flex flex-col gap-1 items-center justify-center bg-background/10 backdrop-blur-sm p-6 rounded-2xl">
                  <MapPin className="w-8 h-8 mb-2 opacity-80" />
                  <span className="text-4xl font-extrabold tracking-tight">10k+</span>
                  <span className="text-sm uppercase tracking-wider font-semibold opacity-80">Issues Resolved</span>
                </div>
                <div className="flex flex-col gap-1 items-center justify-center bg-background/10 backdrop-blur-sm p-6 rounded-2xl">
                  <Users className="w-8 h-8 mb-2 opacity-80" />
                  <span className="text-4xl font-extrabold tracking-tight">50k+</span>
                  <span className="text-sm uppercase tracking-wider font-semibold opacity-80">Active Citizens</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12 px-4 text-center text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-foreground">🚧 Streetly</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} Streetly. Empowering communities worldwide.
          </p>
          <div className="flex gap-4 text-sm font-medium">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
