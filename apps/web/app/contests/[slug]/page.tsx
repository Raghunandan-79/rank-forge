"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../components/auth/auth-context";
import { Navbar } from "../../../components/layout/navbar";
import { api } from "../../../lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Countdown } from "../../../components/contest/countdown";
import { toast } from "sonner";
import { Trophy, FileText, ListOrdered, History, Check, X, ShieldAlert, ArrowLeft, Loader2, Sparkles } from "lucide-react";

export default function ContestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const slug = params?.slug as string;

  const [contest, setContest] = useState<any>(null);
  const [standingsData, setStandingsData] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState("problems");

  const fetchContestData = useCallback(async (currentUserId: string) => {
    try {
      setLoading(true);
      // 1. Fetch contest basic details & problems
      const detailRes = await api.get(`/contests/${slug}`);
      setContest(detailRes.contest);

      // 2. Fetch standings (to verify registration & show Leaderboard)
      const standingsRes = await api.get(`/contests/${slug}/standings`);
      setStandingsData(standingsRes);

      const registered = standingsRes.standings?.some(
        (member: any) => member.userId === currentUserId
      );
      setIsRegistered(!!registered);

      // 3. Fetch user's submissions to filter for this contest
      if (registered) {
        const subsRes = await api.get("/submissions/me?limit=100");
        const contestProblemSlugs = new Set(
          detailRes.contest.problems?.map((p: any) => p.problem.slug)
        );
        const filteredSubs = (subsRes.submissions || []).filter((sub: any) =>
          contestProblemSlugs.has(sub.problem.slug)
        );
        setSubmissions(filteredSubs);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load contest details.");
      router.push("/contests");
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        fetchContestData(user.id);
      }
    }
  }, [user, authLoading, fetchContestData, router]);

  const handleRegister = async () => {
    if (!user) return;
    setRegistering(true);
    try {
      await api.post(`/contests/${slug}/register`);
      toast.success("Registered for contest successfully!");
      setIsRegistered(true);
      await fetchContestData(user.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to register.");
    } finally {
      setRegistering(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-4">Loading contest details...</p>
      </div>
    );
  }

  if (!user || !contest) return null;

  const now = new Date();
  const startTime = new Date(contest.startTime);
  const endTime = new Date(contest.endTime);
  const isStarted = now >= startTime;
  const isEnded = now >= endTime;

  // Unregistered Gate View
  if (!isRegistered) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl flex flex-col justify-center">
          <Card className="border-border bg-card">
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/10 h-14 w-14 rounded-full flex items-center justify-center mb-4 border border-primary/20">
                <ShieldAlert className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl font-extrabold text-foreground">
                Registration Required
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                You must register in order to view problems, submit code, and participate in this contest.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border border-border/60 bg-muted/30 rounded-lg p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Contest:</span>
                  <span className="font-semibold text-foreground">{contest.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Starts At:</span>
                  <span className="font-semibold text-foreground">
                    {startTime.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ends At:</span>
                  <span className="font-semibold text-foreground">
                    {endTime.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Countdown startTime={contest.startTime} endTime={contest.endTime} />
              </div>
            </CardContent>
            <div className="p-6 border-t border-border/50 flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => router.push("/contests")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Contests
              </Button>
              <Button
                className="w-full sm:w-auto ml-auto"
                disabled={isEnded || registering}
                onClick={handleRegister}
              >
                {registering ? "Registering..." : isEnded ? "Registration Closed" : "Register Now"}
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  // Active or Ended Contest Dashboard
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <Link
          href="/contests"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Contests
        </Link>

        {/* Contest Title Header */}
        <div className="border border-border bg-card rounded-xl p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between shadow-sm">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{contest.title}</h1>
            <p className="text-muted-foreground text-sm max-w-2xl">{contest.description}</p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <Countdown startTime={contest.startTime} endTime={contest.endTime} />
            <span className="text-xs text-muted-foreground">
              Duration: {Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60))} hours
            </span>
          </div>
        </div>

        {/* Tabs Block */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="bg-card border border-border w-full justify-start p-1 h-auto flex flex-wrap gap-1">
            <TabsTrigger value="problems" className="gap-2 py-2 cursor-pointer">
              <FileText className="h-4 w-4" />
              Problems
            </TabsTrigger>
            <TabsTrigger value="standings" className="gap-2 py-2 cursor-pointer">
              <Trophy className="h-4 w-4" />
              Standings
            </TabsTrigger>
            <TabsTrigger value="submissions" className="gap-2 py-2 cursor-pointer">
              <History className="h-4 w-4" />
              My Submissions
            </TabsTrigger>
          </TabsList>

          {/* Problems Tab Content */}
          <TabsContent value="problems" className="focus-visible:ring-0">
            {!isStarted ? (
              <Card className="border-border bg-card">
                <CardHeader className="text-center py-10">
                  <div className="mx-auto bg-amber-500/10 h-12 w-12 rounded-full flex items-center justify-center mb-4 border border-amber-500/20">
                    <Sparkles className="h-6 w-6 text-amber-500" />
                  </div>
                  <CardTitle>Contest Has Not Started Yet</CardTitle>
                  <CardDescription className="max-w-md mx-auto mt-2">
                    Problems will become visible and open for submission as soon as the countdown timer reaches zero.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Contest Problems
                  </CardTitle>
                  <CardDescription>
                    Solve the challenges below to earn points. Penalties apply for late or failed submissions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Index</TableHead>
                        <TableHead>Problem Title</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead className="w-32">Difficulty</TableHead>
                        <TableHead className="w-24 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contest.problems?.map((cp: any) => (
                        <TableRow key={cp.problem.slug}>
                          <TableCell className="font-bold text-foreground">{cp.index}</TableCell>
                          <TableCell>
                            <Link
                              href={`/contests/${slug}/problems/${cp.problem.slug}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {cp.problem.title}
                            </Link>
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {cp.points}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`capitalize text-xs font-semibold ${
                                cp.problem.difficulty === "EASY"
                                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
                                  : cp.problem.difficulty === "MEDIUM"
                                  ? "border-amber-500/20 bg-amber-500/5 text-amber-500"
                                  : "border-rose-500/20 bg-rose-500/5 text-rose-500"
                              }`}
                            >
                              {cp.problem.difficulty.toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/contests/${slug}/problems/${cp.problem.slug}`}>
                              <Button size="sm" variant="ghost" className="hover:bg-muted">
                                Solve
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!contest.problems || contest.problems.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No problems added to this contest yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Standings Tab Content */}
          <TabsContent value="standings" className="focus-visible:ring-0">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Live Leaderboard
                </CardTitle>
                <CardDescription>
                  Real-time standings of all participants in this contest sorted by points and penalties.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6 sm:pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-center">Penalty</TableHead>
                      {/* Problem index headers */}
                      {standingsData?.problems?.map((p: any) => (
                        <TableHead key={p.index} className="text-center w-20">
                          {p.index}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standingsData?.standings?.map((row: any) => (
                      <TableRow
                        key={row.userId}
                        className={row.userId === user.id ? "bg-primary/5 hover:bg-primary/10" : ""}
                      >
                        <TableCell className="font-bold text-foreground">
                          {row.rank === 1 ? "🥇 1" : row.rank === 2 ? "🥈 2" : row.rank === 3 ? "🥉 3" : row.rank}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {row.username}
                          {row.userId === user.id && (
                            <Badge className="ml-2 text-[10px] bg-primary/20 text-primary border border-primary/30 py-0 px-1.5">
                              You
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-bold text-foreground">
                          {row.score}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {row.penalty} min
                        </TableCell>
                        {/* Render individual problem scores for this user */}
                        {standingsData?.problems?.map((p: any) => {
                          const prob = row.problems[p.index];
                          if (!prob) {
                            return (
                              <TableCell key={p.index} className="text-center text-muted-foreground/40">
                                &ndash;
                              </TableCell>
                            );
                          }
                          return (
                            <TableCell key={p.index} className="text-center">
                              {prob.solved ? (
                                <div className="inline-flex flex-col items-center justify-center text-emerald-500">
                                  <Check className="h-4 w-4" />
                                  <span className="text-[10px] font-semibold">+{prob.points}</span>
                                </div>
                              ) : (
                                <div className="inline-flex flex-col items-center justify-center text-rose-500">
                                  <X className="h-4 w-4" />
                                  <span className="text-[10px] font-semibold">-{prob.penalty}</span>
                                </div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                    {(!standingsData?.standings || standingsData.standings.length === 0) && (
                      <TableRow>
                        <TableCell
                          colSpan={4 + (standingsData?.problems?.length || 0)}
                          className="text-center text-muted-foreground py-8"
                        >
                          No users registered or scores recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submissions Tab Content */}
          <TabsContent value="submissions" className="focus-visible:ring-0">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  My Submissions
                </CardTitle>
                <CardDescription>
                  Your individual code submissions for this contest's problems.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6 sm:pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Problem</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Memory</TableHead>
                      <TableHead>Tests Passed</TableHead>
                      <TableHead className="text-right">Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((sub: any) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <span className="font-semibold text-foreground">{sub.problem.title}</span>
                        </TableCell>
                        <TableCell className="font-mono text-xs uppercase">{sub.language.toLowerCase()}</TableCell>
                        <TableCell>
                          <Badge
                            className={`font-semibold text-xs py-0.5 px-2 border ${
                              sub.status === "ACCEPTED"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10"
                                : sub.status === "PENDING"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/10"
                                : "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/10"
                            }`}
                          >
                            {sub.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {sub.executionTime != null ? `${sub.executionTime.toFixed(3)}s` : "N/A"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {sub.memoryUsed != null ? `${(sub.memoryUsed / 1024).toFixed(1)} MB` : "N/A"}
                        </TableCell>
                        <TableCell className="text-foreground text-xs font-semibold">
                          {sub.passedTests} / {sub.totalTests}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs">
                          {new Date(sub.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {submissions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          You haven't made any submissions for this contest yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
