import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import { redis } from "./config/redis";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);

app.listen(3000, async () => {
  console.log("Server is running on port 3000");

  const response = await redis.ping();
  console.log("Redis:", response);
});
