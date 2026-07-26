import { Worker } from "bullmq";
import { bullmqRedis } from "../config/redis";
import { prismaClient } from "@repo/db/client";

export const submissionWorker = new Worker(
  "submissions",
  async (job) => {
    const submissionId = job.data.submissionId;

    const submission = await prismaClient.submission.findUnique({
      where: {
        id: submissionId,
      },
      include: {
        problem: {
          include: {
            testCases: true,
          },
        },
      },
    });

    if (!submission) {
      throw new Error("Submission not found");
    }

    await prismaClient.submission.update({
      where: {
        id: submission.id,
      },
      data: {
        status: "PROCESSING",
      },
    });

    console.log("Processing submission:", submission.id);
    console.log("Language:", submission.language);
    console.log("Test cases:", submission.problem.testCases.length);
  },
  {
    connection: bullmqRedis,
  },
);

submissionWorker.on("completed", (job) => {
  console.log("Submission job completed", job.id);
});

submissionWorker.on("failed", (job, error) => {
  console.error("Submission job failed:", job?.id, error);
});
