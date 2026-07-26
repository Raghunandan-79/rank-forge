import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import cors from "cors";
import { redis } from "./config/redis";
import helmet from "helmet";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);


app.use(errorMiddleware);

app.listen(3000, async () => {
  console.log("Server is running on port 3000");

  const response = await redis.ping();
  console.log("Redis:", response);
});
