"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Countdown } from "./countdown";
import { Calendar, Users, FileText, CheckCircle2, ArrowRight } from "lucide-react";

export interface Contest {
  id: string;
  title: string;
  slug: string;
  description: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  _count: {
    problems: number;
    registrations: number;
  };
}

interface ContestCardProps {
  contest: Contest;
  isRegistered: boolean;
  isRegistering: boolean;
  onRegister: (slug: string) => void;
}

export function ContestCard({ contest, isRegistered, isRegistering, onRegister }: ContestCardProps) {
  const now = new Date();
  const start = new Date(contest.startTime);
  const end = new Date(contest.endTime);

  let status: "ACTIVE" | "UPCOMING" | "ENDED" = "UPCOMING";
  if (now >= end) {
    status = "ENDED";
  } else if (now >= start) {
    status = "ACTIVE";
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <Card className="border-border bg-card shadow-md flex flex-col justify-between hover:border-primary/40 transition-all duration-200">
      <div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4 mb-2">
            <Badge
              variant={
                status === "ACTIVE"
                  ? "default"
                  : status === "UPCOMING"
                  ? "secondary"
                  : "outline"
              }
              className={`font-semibold capitalize text-xs ${
                status === "ACTIVE"
                  ? "bg-emerald-500 hover:bg-emerald-500/90 text-white"
                  : status === "UPCOMING"
                  ? "bg-amber-500 hover:bg-amber-500/90 text-white"
                  : "text-muted-foreground border-border"
              }`}
            >
              {status.toLowerCase()}
            </Badge>

            <Countdown startTime={contest.startTime} endTime={contest.endTime} />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground line-clamp-1">
            {contest.title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {contest.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0 text-primary/80" />
            <span>
              {formatDate(contest.startTime)} &ndash; {formatDate(contest.endTime)}
            </span>
          </div>

          <div className="flex gap-4 pt-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-muted-foreground/85" />
              <span>
                <strong className="text-foreground">{contest._count.registrations}</strong> registered
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <FileText className="h-4 w-4 text-muted-foreground/85" />
              <span>
                <strong className="text-foreground">{contest._count.problems}</strong> problems
              </span>
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter className="pt-2 border-t border-border/50 flex items-center justify-between gap-3 mt-auto">
        {isRegistered ? (
          <div className="flex items-center gap-1 text-emerald-500 text-sm font-semibold py-1">
            <CheckCircle2 className="h-4 w-4" />
            <span>Registered</span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            {status === "ENDED" ? "Closed" : "Registration open"}
          </div>
        )}

        <div className="flex gap-2">
          {isRegistered || status === "ENDED" ? (
            <Link href={`/contests/${contest.slug}`}>
              <Button size="sm" variant={status === "ACTIVE" ? "default" : "outline"} className="gap-1">
                Enter Contest
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              variant="default"
              disabled={isRegistering}
              onClick={() => onRegister(contest.slug)}
            >
              {isRegistering ? "Registering..." : "Register"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
