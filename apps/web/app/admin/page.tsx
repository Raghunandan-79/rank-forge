"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "../../components/layout/navbar";
import { useAuth } from "../../components/auth/auth-context";
import { api } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Plus, Trophy, Code2, ShieldAlert, Key, FolderGit, Calendar, ArrowRight, Settings, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";

interface Contest {
  id: string;
  title: string;
  slug: string;
  description: string;
  startTime: string;
  endTime: string;
}

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: "USER" | "PROBLEM_SETTER" | "ADMIN";
}

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // State for Add Problem to Contest dialog
  const [selectedContestSlug, setSelectedContestSlug] = useState<string | null>(null);
  const [assocProblemSlug, setAssocProblemSlug] = useState("");
  const [assocIndex, setAssocIndex] = useState("");
  const [assocPoints, setAssocPoints] = useState("100");
  const [associating, setAssociating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true);
      const promises: Promise<any>[] = [
        api.get("/contests"),
        api.get("/problems"),
      ];

      if (user && user.role === "ADMIN") {
        promises.push(api.get("/users"));
      }

      const [contestsRes, problemsRes, usersRes] = await Promise.all(promises);
      setContests(contestsRes.contests || []);
      setProblems(problemsRes.problems || []);

      if (usersRes) {
        setUsersList(usersRes.users || []);
      }
    } catch (err: any) {
      toast.error("Failed to load dashboard data: " + err.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "ADMIN" || user.role === "PROBLEM_SETTER")) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-sm text-muted-foreground animate-pulse">Loading authorization profile...</div>
        </main>
      </div>
    );
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "PROBLEM_SETTER")) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-6">
          <Card className="max-w-md w-full border-rose-500/25 bg-rose-500/5">
            <CardHeader className="text-center">
              <div className="mx-auto bg-rose-500/10 text-rose-500 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <CardTitle className="text-rose-400">Access Denied</CardTitle>
              <CardDescription className="text-zinc-400">
                You do not have the required permissions to view the Admin or Problem Setter panel.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              <Link href="/contests">
                <Button variant="outline" className="border-border">
                  Return to Contests
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const handleAddProblemToContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContestSlug) return;
    if (!assocProblemSlug || !assocIndex) {
      toast.error("Please fill in all fields");
      return;
    }

    setAssociating(true);
    try {
      await api.post(`/contests/${selectedContestSlug}/problems`, {
        problemSlug: assocProblemSlug,
        index: assocIndex,
        points: parseInt(assocPoints, 10) || 100,
      });
      toast.success("Problem successfully linked to contest!");
      setIsDialogOpen(false);
      setAssocProblemSlug("");
      setAssocIndex("");
      setAssocPoints("100");
    } finally {
      setAssociating(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: "USER" | "PROBLEM_SETTER" | "ADMIN") => {
    if (userId === user?.id) {
      toast.error("You cannot change your own role to prevent lockout.");
      return;
    }
    setUpdatingRoleId(userId);
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      toast.success("User role updated successfully!");
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleDeleteContest = async (slug: string) => {
    if (!window.confirm("Are you sure you want to delete this contest? This action is permanent and will delete registrations, attempts, and scores associated with this contest.")) {
      return;
    }
    try {
      await api.delete(`/contests/${slug}`);
      toast.success("Contest deleted successfully!");
      setContests((prev) => prev.filter((c) => c.slug !== slug));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete contest");
    }
  };

  const handleDeleteProblem = async (slug: string) => {
    if (!window.confirm("Are you sure you want to delete this problem? This action is permanent and will delete all test cases and submissions associated with it.")) {
      return;
    }
    try {
      await api.delete(`/problems/${slug}`);
      toast.success("Problem deleted successfully!");
      setProblems((prev) => prev.filter((p) => p.slug !== slug));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete problem");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.id) {
      toast.error("You cannot delete yourself.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this user? This action is permanent and will delete all their submissions and registrations.")) {
      return;
    }
    try {
      await api.delete(`/users/${userId}`);
      toast.success("User deleted successfully!");
      setUsersList((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Admin & Problem Setter Panel
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage contests, write coding problems, and configure test suites.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {user.role === "ADMIN" && (
              <Link href="/admin/contests/new">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow">
                  <Plus className="h-4 w-4" />
                  New Contest
                </Button>
              </Link>
            )}
            <Link href="/admin/problems/new">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 shadow">
                <Plus className="h-4 w-4" />
                New Problem
              </Button>
            </Link>
          </div>
        </div>

        {loadingData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border bg-card/40 animate-pulse h-60" />
            <Card className="border-border bg-card/40 animate-pulse h-60" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contests Panel */}
            <Card className="border-border bg-card/30 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4 mb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-blue-400" />
                    Contests
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Create and link problems to competition events
                  </CardDescription>
                </div>
                <Badge variant="outline" className="border-blue-500/20 text-blue-400 bg-blue-500/5">
                  {contests.length} Total
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {contests.length === 0 ? (
                  <div className="text-center p-12 text-sm text-zinc-500">
                    No contests registered yet. Get started by clicking "New Contest".
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead className="w-1/2">Title</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contests.map((contest) => (
                        <TableRow key={contest.id} className="border-border/30 hover:bg-zinc-800/10">
                          <TableCell className="font-semibold text-sm text-zinc-200">
                            {contest.title}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-zinc-400">
                            {contest.slug}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                onClick={() => {
                                  setSelectedContestSlug(contest.slug);
                                  setIsDialogOpen(true);
                                }}
                              >
                                Link Problem
                              </Button>
                              <Link href={`/contests/${contest.slug}`}>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-zinc-200">
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </Link>
                              {user.role === "ADMIN" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                  onClick={() => handleDeleteContest(contest.slug)}
                                  title="Delete Contest"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Problems Panel */}
            <Card className="border-border bg-card/30 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4 mb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-purple-400" />
                    Global Problems
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Draft standalone problems and configure their test cases
                  </CardDescription>
                </div>
                <Badge variant="outline" className="border-purple-500/20 text-purple-400 bg-purple-500/5">
                  {problems.length} Total
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {problems.length === 0 ? (
                  <div className="text-center p-12 text-sm text-zinc-500">
                    No problems created yet. Get started by clicking "New Problem".
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead className="w-1/3">Title</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {problems.map((problem) => (
                        <TableRow key={problem.id} className="border-border/30 hover:bg-zinc-800/10">
                          <TableCell className="font-semibold text-sm text-zinc-200">
                            {problem.title}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                problem.difficulty === "EASY"
                                  ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5"
                                  : problem.difficulty === "MEDIUM"
                                  ? "border-amber-500/20 text-amber-400 bg-amber-500/5"
                                  : "border-rose-500/20 text-rose-400 bg-rose-500/5"
                              }
                            >
                              {problem.difficulty}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/admin/problems/${problem.slug}/test-cases`}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                                >
                                  Test Cases
                                </Button>
                              </Link>
                              {user.role === "ADMIN" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                  onClick={() => handleDeleteProblem(problem.slug)}
                                  title="Delete Problem"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {user.role === "ADMIN" && (
          <div className="mt-8">
            <Card className="border-border bg-card/30 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4 mb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-400" />
                    User Access Management
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Manage roles and permissions for RankForge members (promote users to Problem Setters or Admins).
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {usersList.length === 0 ? (
                  <div className="text-center p-12 text-sm text-zinc-500">
                    No other users found.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Current Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersList.map((u) => (
                        <TableRow key={u.id} className="border-border/30 hover:bg-zinc-800/10">
                          <TableCell className="font-semibold text-sm text-zinc-200">
                            {u.username} {u.id === user.id && <span className="text-[10px] text-zinc-500 ml-1">(You)</span>}
                          </TableCell>
                          <TableCell className="text-sm text-zinc-400 font-mono">
                            {u.email}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                u.role === "ADMIN"
                                  ? "border-rose-500/20 text-rose-400 bg-rose-500/5"
                                  : u.role === "PROBLEM_SETTER"
                                  ? "border-purple-500/20 text-purple-400 bg-purple-500/5"
                                  : "border-zinc-500/20 text-zinc-400 bg-zinc-500/5"
                              }
                            >
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {u.id === user.id ? (
                              <span className="text-xs text-zinc-500">Locked</span>
                            ) : (
                              <div className="flex justify-end items-center gap-2">
                                <select
                                  value={u.role}
                                  disabled={updatingRoleId === u.id}
                                  onChange={(e) => handleUpdateRole(u.id, e.target.value as any)}
                                  className="bg-black/40 border border-border rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 cursor-pointer"
                                >
                                  <option value="USER" className="bg-[#151515]">User</option>
                                  <option value="PROBLEM_SETTER" className="bg-[#151515]">Problem Setter</option>
                                  <option value="ADMIN" className="bg-[#151515]">Admin</option>
                                </select>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                  onClick={() => handleDeleteUser(u.id)}
                                  title="Delete User"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Modal for linking a problem to a contest */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#151515] border border-border rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl text-foreground">
            <form onSubmit={handleAddProblemToContest}>
              <div className="space-y-1">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FolderGit className="h-5 w-5 text-blue-400" />
                  Link Problem to Contest
                </h3>
                <p className="text-zinc-400 text-xs">
                  Contest Slug: <code className="font-mono text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded">{selectedContestSlug}</code>
                </p>
              </div>

              <div className="space-y-4 my-4">
                <div className="space-y-1">
                  <Label htmlFor="problemSlug">Problem Slug</Label>
                  <Input
                    id="problemSlug"
                    placeholder="e.g. two-sum"
                    className="bg-black/30 border-border"
                    value={assocProblemSlug}
                    onChange={(e: any) => setAssocProblemSlug(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="index">Index (e.g. A, B, C)</Label>
                    <Input
                      id="index"
                      placeholder="A"
                      className="bg-black/30 border-border"
                      value={assocIndex}
                      onChange={(e: any) => setAssocIndex(e.target.value)}
                      maxLength={3}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="points">Points Awarded</Label>
                    <Input
                      id="points"
                      type="number"
                      placeholder="100"
                      className="bg-black/30 border-border"
                      value={assocPoints}
                      onChange={(e: any) => setAssocPoints(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  className="border-border text-zinc-400 hover:text-zinc-200"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={associating}
                >
                  {associating ? "Linking..." : "Link Problem"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
