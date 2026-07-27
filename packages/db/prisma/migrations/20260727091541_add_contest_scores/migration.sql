-- CreateTable
CREATE TABLE "ContestScore" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "solvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContestScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContestScore_contestId_userId_idx" ON "ContestScore"("contestId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestScore_contestId_userId_problemId_key" ON "ContestScore"("contestId", "userId", "problemId");

-- AddForeignKey
ALTER TABLE "ContestScore" ADD CONSTRAINT "ContestScore_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestScore" ADD CONSTRAINT "ContestScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestScore" ADD CONSTRAINT "ContestScore_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
