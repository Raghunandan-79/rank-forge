"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/auth/auth-context";
import { Navbar } from "../components/layout/navbar";
import { Button } from "../components/ui/button";
import Link from "next/link";
import { Trophy, Code2, Users2, Terminal } from "lucide-react";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/contests");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading RankForge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-background flex flex-col justify-center py-12">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/50 text-xs font-medium text-primary">
            <Terminal className="h-3.5 w-3.5" />
            <span>Competitive Programming Platform</span>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
              Forge Your Path to{" "}
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Coding Mastery
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Compete in real-time programming contests, solve challenging algorithmic problems, track standings live, and rise through the ranks.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="font-semibold px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="font-semibold px-8">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 max-w-4xl mx-auto text-left">
            <div className="border border-border bg-card/30 p-6 rounded-lg space-y-2">
              <div className="p-2 w-fit rounded bg-blue-500/10 text-blue-500">
                <Trophy className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">Real-time Contests</h3>
              <p className="text-sm text-muted-foreground">
                Join structured competitive contests, solve problem sets within a time limit, and test your speed.
              </p>
            </div>
            <div className="border border-border bg-card/30 p-6 rounded-lg space-y-2">
              <div className="p-2 w-fit rounded bg-purple-500/10 text-purple-500">
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">Multi-Language Code Editor</h3>
              <p className="text-sm text-muted-foreground">
                Write solutions in C, C++, Java, Python, or JavaScript directly in our Monaco-powered code editor.
              </p>
            </div>
            <div className="border border-border bg-card/30 p-6 rounded-lg space-y-2">
              <div className="p-2 w-fit rounded bg-red-500/10 text-red-500">
                <Users2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">Live Standings</h3>
              <p className="text-sm text-muted-foreground">
                Track leaderboard updates instantaneously through our automated server-sent events system.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
