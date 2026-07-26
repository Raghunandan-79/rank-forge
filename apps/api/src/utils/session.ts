import { randomBytes } from "crypto";
import { redis } from "../config/redis";

export type SessionData = {
  userId: string;
  csrfToken: string;
};

export function generateSessionId() {
  return randomBytes(32).toString("hex");
}

export function generateCsrfToken() {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: string) {
  const sessionId = generateSessionId();
  const csrfToken = generateCsrfToken();

  const sessionKey = `session:${sessionId}`;

  const sessionData = {
    userId,
    csrfToken,
  };

  await redis.set(
    sessionKey,
    JSON.stringify(sessionData),
    "EX",
    60 * 60 * 24 * 7,
  );

  return {
    sessionId,
    csrfToken,
  };
}

export async function deleteSession(sessionId: string) {
  const sessionKey = `session:${sessionId}`;

  await redis.del(sessionKey);
}
