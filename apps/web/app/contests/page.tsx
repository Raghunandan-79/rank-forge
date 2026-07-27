"use client";

import { useAuth } from "../../components/auth/auth-context";
import { Navbar } from "../../components/layout/navbar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ContestsStub() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <div className="border border-border p-6 rounded-lg bg-card">
          <h1 className="text-2xl font-bold mb-2">Contests Page (Phase 2)</h1>
          <p className="text-muted-foreground">
            Welcome back, <span className="font-semibold text-foreground">{user.username}</span>! You have successfully authenticated.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            User ID: {user.id} | Email: {user.email} | Role: {user.role || "USER"}
          </p>
        </div>
      </main>
    </div>
  );
}
