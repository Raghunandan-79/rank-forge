import { Queue } from "bullmq";
import { bullmqRedis } from "../config/redis";

export const submissionQueue = new Queue("submissions", {
  connection: bullmqRedis,
});
