import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import cors from "cors";
import helmet from "helmet";
import "./workers/submission.worker";
import { redis } from "./config/redis";
import { errorMiddleware } from "./middleware/error.middleware";
import { notFoundMiddleware } from "./middleware/not-found.middleware";
import problemRouter from "./routes/problem.route";
import submissionRouter from "./routes/submission.routes";
import contestRouter from "./routes/contest.routes";
import userRouter from "./routes/user.routes";

const app = express();
app.disable("x-powered-by");

app.use(helmet());

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL,
  "http://localhost:3001",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) {
        return callback(null, true);
      }

      const isDev = process.env.NODE_ENV !== "production";
      const isAllowed =
        allowedOrigins.includes(origin) ||
        (isDev &&
          (origin.startsWith("http://localhost:") ||
            origin.endsWith(".devtunnels.ms") ||
            origin.endsWith(".gitpod.io") ||
            origin.endsWith(".githubpreview.dev")));

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked request from origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  }),
);

app.use(
  express.json({
    limit: "100kb",
  }),
);
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/problems", problemRouter);
app.use("/api/v1/submissions", submissionRouter);
app.use("/api/v1/contests", contestRouter);
app.use("/api/v1/users", userRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server is running on port ${PORT}`);

  const response = await redis.ping();
  console.log("Redis:", response);
});
