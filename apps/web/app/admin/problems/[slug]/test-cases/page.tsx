"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "../../../../../components/layout/navbar";
import { useAuth } from "../../../../../components/auth/auth-context";
import { api } from "../../../../../lib/api";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/table";
import { Label } from "../../../../../components/ui/label";
import { Textarea } from "../../../../../components/ui/textarea";
import { Badge } from "../../../../../components/ui/badge";
import { ArrowLeft, Plus, Trash2, Key, ShieldAlert, FlaskConical, CheckCircle2, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface ProblemData {
  id: string;
  title: string;
  slug: string;
  testCases: TestCase[];
}

export default function ProblemTestCasesPage() {
  const { user, loading } = useAuth();
  const { slug } = useParams();

  const [problem, setProblem] = useState<ProblemData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Form states
  const [input, setInput] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [isHidden, setIsHidden] = useState(true);
  const [addingCase, setAddingCase] = useState(false);

  const fetchTestCases = async () => {
    try {
      setLoadingData(true);
      const data = await api.get(`/problems/${slug}/admin-test-cases`);
      if (data.problem) {
        setProblem(data.problem);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load test cases");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (slug && user && (user.role === "ADMIN" || user.role === "PROBLEM_SETTER")) {
      fetchTestCases();
    }
  }, [slug, user]);

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
                You do not have the required permissions to view this page.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  const handleAddTestCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !expectedOutput.trim()) {
      toast.error("Please fill in both input and expected output fields");
      return;
    }

    setAddingCase(true);
    try {
      await api.post(`/problems/${slug}/test-cases`, {
        input,
        expectedOutput,
        isHidden,
      });
      toast.success("Test case added successfully!");
      setInput("");
      setExpectedOutput("");
      // Refresh the list
      fetchTestCases();
    } catch (err: any) {
      toast.error(err.message || "Failed to create test case");
    } finally {
      setAddingCase(false);
    }
  };

  const handleDeleteTestCase = async (id: string) => {
    if (!confirm("Are you sure you want to delete this test case?")) return;

    try {
      await api.delete(`/problems/${slug}/test-cases/${id}`);
      toast.success("Test case deleted");
      fetchTestCases();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete test case");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <div className="flex items-center justify-between gap-4 mb-8 border-b border-border/40 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FlaskConical className="h-6 w-6 text-purple-400" />
              Manage Test Cases
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Problem: <span className="font-semibold text-zinc-300">{problem?.title || slug}</span>
            </p>
          </div>
          <Badge variant="outline" className="border-purple-500/20 text-purple-400 bg-purple-500/5">
            {problem?.testCases?.length || 0} Test Cases
          </Badge>
        </div>

        {loadingData ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-20 bg-card/30 rounded border border-border" />
            <div className="h-40 bg-card/30 rounded border border-border" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Existing Test Cases Table */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-border bg-card/30 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold">Configured Test Cases</CardTitle>
                  <CardDescription className="text-xs">
                    Verification inputs and outputs executed inside the judging worker environment.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {problem?.testCases.length === 0 ? (
                    <div className="text-center p-12 text-sm text-zinc-500 font-mono">
                      No test cases exist for this problem yet. Add one on the right panel.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/40 hover:bg-transparent">
                          <TableHead className="w-12 text-center">#</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="w-1/3">Input</TableHead>
                          <TableHead className="w-1/3">Expected Output</TableHead>
                          <TableHead className="w-16 text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {problem?.testCases.map((tc, idx) => (
                          <TableRow key={tc.id} className="border-border/30 hover:bg-zinc-800/10 font-mono text-xs text-zinc-300">
                            <TableCell className="text-center text-zinc-500 font-semibold">{idx + 1}</TableCell>
                            <TableCell>
                              {tc.isHidden ? (
                                <Badge variant="outline" className="border-amber-500/25 text-amber-500 bg-amber-500/5 text-[10px] flex items-center gap-1 w-fit">
                                  <EyeOff className="h-3 w-3" />
                                  Hidden
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-emerald-500/25 text-emerald-500 bg-emerald-500/5 text-[10px] flex items-center gap-1 w-fit">
                                  <Eye className="h-3 w-3" />
                                  Public
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate" title={tc.input}>
                              {tc.input.length > 50 ? tc.input.slice(0, 50) + "..." : tc.input}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate" title={tc.expectedOutput}>
                              {tc.expectedOutput.length > 50 ? tc.expectedOutput.slice(0, 50) + "..." : tc.expectedOutput}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                onClick={() => handleDeleteTestCase(tc.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Add Test Case Form */}
            <div className="space-y-4">
              <Card className="border-border bg-card/30 backdrop-blur-sm sticky top-20">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-1.5">
                    <Plus className="h-4 w-4 text-purple-400" />
                    Add Test Case
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Append a new case to the problem's validation suite.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddTestCase} className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="input">Input Data</Label>
                      <Textarea
                        id="input"
                        placeholder="e.g. 5&#10;1 2 3 4 5"
                        className="bg-black/30 border-border min-h-[90px] font-mono text-xs"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="expected">Expected Output</Label>
                      <Textarea
                        id="expected"
                        placeholder="e.g. 5 4 3 2 1"
                        className="bg-black/30 border-border min-h-[90px] font-mono text-xs"
                        value={expectedOutput}
                        onChange={(e) => setExpectedOutput(e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between border border-border/40 p-3 rounded-lg bg-black/10">
                      <div className="space-y-0.5">
                        <Label htmlFor="isHidden" className="text-sm font-semibold cursor-pointer">Hidden Case</Label>
                        <p className="text-[10px] text-zinc-500">
                          Hidden cases are not shown in standard tabs on failure/run.
                        </p>
                      </div>
                      <input
                        id="isHidden"
                        type="checkbox"
                        checked={isHidden}
                        onChange={(e) => setIsHidden(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 bg-black/30 cursor-pointer"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={addingCase}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow"
                    >
                      {addingCase ? "Adding..." : "Add Test Case"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
