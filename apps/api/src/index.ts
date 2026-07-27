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

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
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

app.listen(3000, async () => {
  console.log("Server is running on port 3000");

  const response = await redis.ping();
  console.log("Redis:", response);
});
