import type { Request, Response } from "express";
import { prismaClient } from "@repo/db/client";
import { redisSubscriber } from "../config/redis";

export async function contestStandingsStreamController(
  req: Request,
  res: Response,
) {
  const { slug } = req.params;

  if (typeof slug !== "string") {
    return res.status(400).json({
      error: "Contest slug is required",
    });
  }

  const contest = await prismaClient.contest.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
    },
  });

  if (!contest) {
    return res.status(404).json({
      error: "Contest not found",
    });
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.flushHeaders();

  const channel = `contest:${contest.id}:standings`;

  // Subscribe to Redis channel
  await redisSubscriber.subscribe(channel);

  const handleMessage = (receivedChannel: string, message: string) => {
    if (receivedChannel !== channel) {
      return;
    }

    res.write(`event: standings-update\n`);
    res.write(`data: ${message}\n\n`);
  };

  redisSubscriber.on("message", handleMessage);

  // Tell browser SSE connection is established
  res.write(`event: connected\n`);
  res.write(
    `data: ${JSON.stringify({
      connected: true,
      contestId: contest.id,
    })}\n\n`,
  );

  req.on("close", () => {
    redisSubscriber.off("message", handleMessage);

    res.end();
  });
}