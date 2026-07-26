-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "executionTime" DOUBLE PRECISION,
ADD COLUMN     "memoryUsed" INTEGER,
ADD COLUMN     "passedTests" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalTests" INTEGER NOT NULL DEFAULT 0;
