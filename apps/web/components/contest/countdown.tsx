"use client";

import { useEffect, useState, useCallback } from "react";
import { Timer } from "lucide-react";

interface CountdownProps {
  startTime: string | Date;
  endTime: string | Date;
  onStatusChange?: () => void;
}

export function Countdown({ startTime, endTime, onStatusChange }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [status, setStatus] = useState<"UPCOMING" | "ACTIVE" | "ENDED">("UPCOMING");

  const calculateTime = useCallback(() => {
    const now = new Date().getTime();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    let targetTime = 0;
    let newStatus: "UPCOMING" | "ACTIVE" | "ENDED" = "UPCOMING";

    if (now < start) {
      targetTime = start - now;
      newStatus = "UPCOMING";
    } else if (now < end) {
      targetTime = end - now;
      newStatus = "ACTIVE";
    } else {
      newStatus = "ENDED";
    }

    if (newStatus !== status) {
      setStatus(newStatus);
      if (onStatusChange) onStatusChange();
    }

    if (newStatus === "ENDED") {
      setTimeLeft("Ended");
      return;
    }

    const days = Math.floor(targetTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((targetTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((targetTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((targetTime % (1000 * 60)) / 1000);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    const prefix = newStatus === "UPCOMING" ? "Starts in: " : "Ends in: ";
    setTimeLeft(`${prefix}${parts.join(" ")}`);
  }, [startTime, endTime, status, onStatusChange]);

  useEffect(() => {
    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [calculateTime]);

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold select-none ${
      status === "UPCOMING"
        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
        : status === "ACTIVE"
        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 animate-pulse"
        : "bg-muted text-muted-foreground border border-transparent"
    }`}>
      <Timer className="h-3.5 w-3.5" />
      <span>{timeLeft}</span>
    </div>
  );
}
