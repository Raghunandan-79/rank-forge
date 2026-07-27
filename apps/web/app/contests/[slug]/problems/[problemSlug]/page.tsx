"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../../components/auth/auth-context";
import { Navbar } from "../../../../../components/layout/navbar";
import { api } from "../../../../../lib/api";
import { Button } from "../../../../../components/ui/button";
import { Badge } from "../../../../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../components/ui/select";
import Editor from "@monaco-editor/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Code2,
  Cpu,
  Database,
  FileText,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Copy,
  Check
} from "lucide-react";

type ProgrammingLang = "PYTHON" | "JAVASCRIPT" | "CPP" | "JAVA" | "C";

const LANGUAGE_TEMPLATES: Record<ProgrammingLang, string> = {
  PYTHON: `# Write your Python code here
import sys

def main():
    # Read input from standard input
    # input_data = sys.stdin.read()
    # print("Hello World")
    pass

if __name__ == '__main__':
    main()`,
  JAVASCRIPT: `// Write your JavaScript code here
const fs = require('fs');

function main() {
    // Read input from standard input
    // const input = fs.readFileSync('/dev/stdin', 'utf-8');
    console.log("Hello World");
}

main();`,
  CPP: `#include <iostream>

using namespace std;

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Write your C++ code here
    cout << "Hello World\\n";
    
    return 0;
}`,
  JAVA: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        // Write your Java code here
        System.out.println("Hello World");
    }
}`,
  C: `#include <stdio.h>

int main() {
    // Write your C code here
    printf("Hello World\\n");
    return 0;
}`
};

const MONACO_LANG_MAP: Record<ProgrammingLang, string> = {
  PYTHON: "python",
  JAVASCRIPT: "javascript",
  CPP: "cpp",
  JAVA: "java",
  C: "c"
};

export default function ProblemSolvingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const contestSlug = params?.slug as string;
  const problemSlug = params?.problemSlug as string;

  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLang>("PYTHON");
  const [code, setCode] = useState<string>(LANGUAGE_TEMPLATES.PYTHON);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Submission Results state
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);
  const pollIntervalRef = useRef<any>(null);

  const fetchProblemData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch problem details
      const res = await api.get(`/problems/${problemSlug}`);
      setProblem(res.problem);
    } catch (err: any) {
      toast.error(err.message || "Failed to load problem details.");
      router.push(`/contests/${contestSlug}`);
    } finally {
      setLoading(false);
    }
  }, [problemSlug, contestSlug, router]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        fetchProblemData();
      }
    }
  }, [user, authLoading, fetchProblemData, router]);

  // Clean up poll interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleLanguageChange = (value: string) => {
    const lang = value as ProgrammingLang;
    setSelectedLanguage(lang);
    setCode(LANGUAGE_TEMPLATES[lang]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Test case copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pollSubmissionStatus = (submissionId: string) => {
    setPollingStatus("Judging...");
    let attempts = 0;

    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await api.get(`/submissions/${submissionId}`);
        const sub = res.submission;

        if (sub.status !== "PENDING" || attempts > 30) {
          clearInterval(pollIntervalRef.current);
          setSubmissionResult(sub);
          setPollingStatus(null);
          setSubmitting(false);

          if (sub.status === "ACCEPTED") {
            toast.success("Accepted! All test cases passed!");
          } else {
            toast.error(`Submission failed: ${sub.status.replace("_", " ")}`);
          }
        }
      } catch (err) {
        clearInterval(pollIntervalRef.current);
        setPollingStatus(null);
        setSubmitting(false);
        toast.error("Failed to query submission status.");
      }
    }, 1500);
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error("Code cannot be empty.");
      return;
    }

    setSubmitting(true);
    setSubmissionResult(null);
    setPollingStatus("Submitting...");

    try {
      const res = await api.post(
        `/contests/${contestSlug}/problems/${problemSlug}/submissions`,
        {
          sourceCode: code,
          language: selectedLanguage
        }
      );

      const subId = res.submission?.id;
      if (subId) {
        pollSubmissionStatus(subId);
      } else {
        throw new Error("Invalid response from server.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit code.");
      setPollingStatus(null);
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-4">Loading workspace...</p>
      </div>
    );
  }

  if (!user || !problem) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      {/* Subheader */}
      <div className="border-b border-border bg-card/65 px-6 py-3 flex items-center justify-between">
        <Link
          href={`/contests/${contestSlug}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Contest
        </Link>
        <span className="text-xs font-mono text-muted-foreground">
          Contest: {contestSlug}
        </span>
      </div>

      {/* Main Workspace Split screen */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden h-[calc(100vh-100px)]">
        {/* Left Column: Problem Details */}
        <div className="border-r border-border overflow-y-auto p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={`capitalize text-xs font-bold ${
                  problem.difficulty === "EASY"
                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
                    : problem.difficulty === "MEDIUM"
                    ? "border-amber-500/20 bg-amber-500/5 text-amber-500"
                    : "border-rose-500/20 bg-rose-500/5 text-rose-500"
                }`}
              >
                {problem.difficulty.toLowerCase()}
              </Badge>
              <span className="text-xs text-muted-foreground">Max score: 100 pts</span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              {problem.title}
            </h1>

            {/* Constraints */}
            <div className="flex gap-4 pt-1 border-y border-border/50 py-2.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5" />
                <span>Time Limit: 1.0s</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5" />
                <span>Memory Limit: 256 MB</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4 text-foreground text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {problem.description}
          </div>

          {/* Examples */}
          {problem.examples && problem.examples.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border/60">
              <h3 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                Sample Test Cases
              </h3>

              <div className="space-y-4">
                {problem.examples.map((example: any, idx: number) => (
                  <div key={example.id} className="border border-border rounded-lg bg-card/40 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground border-b border-border pb-2">
                      <span>Example {idx + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          copyToClipboard(
                            `Input:\n${example.input}\n\nExpected Output:\n${example.expectedOutput}`,
                            example.id
                          )
                        }
                      >
                        {copiedId === example.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">Input</span>
                        <pre className="font-mono text-xs bg-muted p-2.5 rounded border border-border/40 overflow-x-auto text-foreground">
                          {example.input}
                        </pre>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">Output</span>
                        <pre className="font-mono text-xs bg-muted p-2.5 rounded border border-border/40 overflow-x-auto text-foreground">
                          {example.expectedOutput}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Code Editor & Runner */}
        <div className="flex flex-col bg-card/20 overflow-hidden">
          {/* Editor Header controls */}
          <div className="border-b border-border bg-card/65 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Code Editor</span>
            </div>

            <div className="flex items-center gap-2">
              <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-36 h-8 text-xs bg-background">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PYTHON">Python 3</SelectItem>
                  <SelectItem value="JAVASCRIPT">JavaScript</SelectItem>
                  <SelectItem value="CPP">C++</SelectItem>
                  <SelectItem value="JAVA">Java</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Monaco Editor Canvas */}
          <div className="flex-1 bg-[#1e1e1e] relative min-h-[300px]">
            <Editor
              height="100%"
              language={MONACO_LANG_MAP[selectedLanguage]}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                automaticLayout: true,
                padding: { top: 12 },
                tabSize: 4
              }}
            />
          </div>

          {/* Bottom Execution Panel */}
          <div className="border-t border-border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                {pollingStatus ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>{pollingStatus}</span>
                  </>
                ) : (
                  <span>Ready to submit.</span>
                )}
              </div>

              <Button
                className="gap-2 px-6"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 fill-current" />
                )}
                Submit Code
              </Button>
            </div>

            {/* Judging Result Summary Card */}
            {submissionResult && (
              <div className={`p-4 rounded-lg border text-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                submissionResult.status === "ACCEPTED"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-500"
              }`}>
                <div className="flex items-start gap-3">
                  {submissionResult.status === "ACCEPTED" ? (
                    <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold flex items-center gap-2">
                      <span>Result: {submissionResult.status.replace("_", " ")}</span>
                      <Badge variant="outline" className={`text-[10px] uppercase font-mono ${
                        submissionResult.status === "ACCEPTED" ? "border-emerald-500/30 text-emerald-500" : "border-rose-500/30 text-rose-500"
                      }`}>
                        {submissionResult.passedTests} / {submissionResult.totalTests} Passed
                      </Badge>
                    </p>
                    <p className="text-xs opacity-90">
                      Execution Time: {submissionResult.executionTime != null ? `${submissionResult.executionTime.toFixed(3)}s` : "N/A"} | 
                      Memory Used: {submissionResult.memoryUsed != null ? `${(submissionResult.memoryUsed / 1024).toFixed(1)} MB` : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
