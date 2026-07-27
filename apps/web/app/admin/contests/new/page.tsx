"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "../../../../components/layout/navbar";
import { useAuth } from "../../../../components/auth/auth-context";
import { api } from "../../../../lib/api";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { Trophy, ArrowLeft, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function CreateContestPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !slug || !description || !startTime || !endTime) {
      toast.error("Please fill in all fields");
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      toast.error("End time must be after start time");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/contests", {
        title,
        slug,
        description,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
      toast.success("Contest created successfully!");
      router.push("/admin");
    } catch (err: any) {
      toast.error(err.message || "Failed to create contest");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <Card className="border-border bg-card/30 backdrop-blur-sm">
          <CardHeader className="border-b border-border/40 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-xl font-bold">Create New Contest</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Host a new competition on RankForge with custom start and end schedules.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <Label htmlFor="title">Contest Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Weekly Contest #4"
                  className="bg-black/30 border-border"
                  value={title}
                  onChange={(e: any) => handleTitleChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="slug">Contest Slug</Label>
                <Input
                  id="slug"
                  placeholder="e.g. weekly-contest-4"
                  className="bg-black/30 border-border font-mono"
                  value={slug}
                  onChange={(e: any) => setSlug(e.target.value)}
                  required
                />
                <p className="text-[10px] text-zinc-500">
                  Lowercase letters, numbers, and hyphens only (e.g. weekly-contest-4).
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the rules, point scale, and outline of this contest..."
                  className="bg-black/30 border-border min-h-[120px]"
                  value={description}
                  onChange={(e: any) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="startTime">Start Date & Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    className="bg-black/30 border-border text-foreground"
                    value={startTime}
                    onChange={(e: any) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endTime">End Date & Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    className="bg-black/30 border-border text-foreground"
                    value={endTime}
                    onChange={(e: any) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border/40">
                <Link href="/admin">
                  <Button type="button" variant="outline" className="border-border">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow"
                >
                  {submitting ? "Creating..." : "Create Contest"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
