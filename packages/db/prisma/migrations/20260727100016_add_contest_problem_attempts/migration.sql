-- CreateTable
CREATE TABLE "ContestProblemAttempt" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "wrongAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContestProblemAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContestProblemAttempt_contestId_userId_idx" ON "ContestProblemAttempt"("contestId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestProblemAttempt_contestId_userId_problemId_key" ON "ContestProblemAttempt"("contestId", "userId", "problemId");

-- AddForeignKey
ALTER TABLE "ContestProblemAttempt" ADD CONSTRAINT "ContestProblemAttempt_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestProblemAttempt" ADD CONSTRAINT "ContestProblemAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestProblemAttempt" ADD CONSTRAINT "ContestProblemAttempt_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
