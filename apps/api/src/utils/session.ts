import { randomBytes } from "crypto";
import { redis } from "../config/redis";

export function generateSessionId() {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: string) {
    const sessionId = generateSessionId();
    const sessionKey = `session:${sessionId}`;

    await redis.set(
        sessionKey,
        userId,
        "EX",
        60 * 60 * 24 * 7,
    );

    return sessionId;
}