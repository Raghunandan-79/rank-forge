"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/auth/auth-context";
import { Navbar } from "../../components/layout/navbar";
import { ContestCard, type Contest } from "../../components/contest/contest-card";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { AlertCircle, RefreshCw, Trophy } from "lucide-react";
import { Button } from "../../components/ui/button";

export default function ContestsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [contests, setContests] = useState<Contest[]>([]);
  const [registeredSlugs, setRegisteredSlugs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [registeringSlug, setRegisteringSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchContests = useCallback(async (currentUserId: string) => {
    try {
      setError(null);
      const data = await api.get("/contests");
      const list: Contest[] = data.contests || [];
      setContests(list);

      // Fetch standings for each contest to check if the current user is registered
      const regMap: Record<string, boolean> = {};
      await Promise.all(
        list.map(async (c) => {
          try {
            const standingsData = await api.get(`/contests/${c.slug}/standings`);
            const isReg = standingsData.standings?.some(
              (member: any) => member.userId === currentUserId
            );
            regMap[c.slug] = !!isReg;
          } catch (err) {
            regMap[c.slug] = false;
          }
        })
      );
      setRegisteredSlugs(regMap);
    } catch (err: any) {
      setError(err.message || "Failed to load contests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        fetchContests(user.id);
      }
    }
  }, [user, authLoading, router, fetchContests]);

  const handleRegister = async (slug: string) => {
    if (!user) return;
    setRegisteringSlug(slug);
    try {
      await api.post(`/contests/${slug}/register`);
      toast.success("Registered for contest successfully!");
      setRegisteredSlugs((prev) => ({ ...prev, [slug]: true }));
      // Reload contests to update counts
      fetchContests(user.id);
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setRegisteringSlug(null);
    }
  };

  if (authLoading || (loading && contests.length === 0)) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground mt-4">Loading contests dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  const now = new Date();
  const activeContests = contests.filter(
    (c) => now >= new Date(c.startTime) && now < new Date(c.endTime)
  );
  const upcomingContests = contests.filter((c) => now < new Date(c.startTime));
  const pastContests = contests.filter((c) => now >= new Date(c.endTime));

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl space-y-10">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Trophy className="h-7 w-7 text-primary" />
              Contests
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Participate in live competitive coding challenges and view standings.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => {
              setLoading(true);
              fetchContests(user.id);
            }}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Failed to fetch contests</p>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Active Contests */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight">Active Contests ({activeContests.length})</h2>
          </div>
          {activeContests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeContests.map((c) => (
                <ContestCard
                  key={c.id}
                  contest={c}
                  isRegistered={!!registeredSlugs[c.slug]}
                  isRegistering={registeringSlug === c.slug}
                  onRegister={handleRegister}
                />
              ))}
            </div>
          ) : (
            <div className="border border-border/50 border-dashed rounded-lg p-8 text-center text-muted-foreground text-sm">
              No active contests right now. Check upcoming list below.
            </div>
          )}
        </section>

        {/* Upcoming Contests */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <h2 className="text-xl font-bold tracking-tight">Upcoming Contests ({upcomingContests.length})</h2>
          </div>
          {upcomingContests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingContests.map((c) => (
                <ContestCard
                  key={c.id}
                  contest={c}
                  isRegistered={!!registeredSlugs[c.slug]}
                  isRegistering={registeringSlug === c.slug}
                  onRegister={handleRegister}
                />
              ))}
            </div>
          ) : (
            <div className="border border-border/50 border-dashed rounded-lg p-8 text-center text-muted-foreground text-sm">
              No upcoming contests scheduled.
            </div>
          )}
        </section>

        {/* Past Contests */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-muted-foreground">Past Contests ({pastContests.length})</h2>
          {pastContests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75 hover:opacity-100 transition-opacity duration-200">
              {pastContests.map((c) => (
                <ContestCard
                  key={c.id}
                  contest={c}
                  isRegistered={!!registeredSlugs[c.slug]}
                  isRegistering={false}
                  onRegister={() => {}}
                />
              ))}
            </div>
          ) : (
            <div className="border border-border/50 border-dashed rounded-lg p-8 text-center text-muted-foreground text-sm">
              No past contests found.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
