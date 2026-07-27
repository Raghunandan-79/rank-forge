import { prismaClient } from "@repo/db/client";
import type {
  AddContestProblemInput,
  CreateContestInput,
} from "../schemas/schemas";

export async function createContestService(data: CreateContestInput) {
  const existingContest = await prismaClient.contest.findUnique({
    where: {
      slug: data.slug,
    },
  });

  if (existingContest) {
    throw new Error("Contest with this slug already exists");
  }

  return prismaClient.contest.create({
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
    },
  });
}

export async function getContestsService() {
  return prismaClient.contest.findMany({
    orderBy: {
      startTime: "desc",
    },

    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      startTime: true,
      endTime: true,
      createdAt: true,

      _count: {
        select: {
          problems: true,
          registrations: true,
        },
      },
    },
  });
}

export async function getContestBySlugService(slug: string) {
  return prismaClient.contest.findUnique({
    where: {
      slug,
    },

    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      startTime: true,
      endTime: true,
      createdAt: true,

      problems: {
        orderBy: {
          index: "asc",
        },

        select: {
          index: true,
          points: true,

          problem: {
            select: {
              title: true,
              slug: true,
              difficulty: true,
              timeLimit: true,
              memoryLimit: true,
            },
          },
        },
      },

      _count: {
        select: {
          registrations: true,
        },
      },
    },
  });
}

export async function addContestProblemService(
  contestSlug: string,
  data: AddContestProblemInput,
) {
  const contest = await prismaClient.contest.findUnique({
    where: {
      slug: contestSlug,
    },
    select: {
      id: true,
    },
  });

  if (!contest) {
    throw new Error("Contest not found");
  }

  const problem = await prismaClient.problem.findUnique({
    where: {
      slug: data.problemSlug,
    },
    select: {
      id: true,
    },
  });

  if (!problem) {
    throw new Error("Problem not found");
  }

  const contestProblem = await prismaClient.contestProblem.create({
    data: {
      contestId: contest.id,
      problemId: problem.id,
      index: data.index,
      points: data.points,
    },
    select: {
      id: true,
      index: true,
      points: true,
      createdAt: true,

      problem: {
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          timeLimit: true,
          memoryLimit: true,
        },
      },
    },
  });

  return contestProblem;
}

export async function registerForContestService(
  userId: string,
  contestSlug: string,
) {
  const contest = await prismaClient.contest.findUnique({
    where: {
      slug: contestSlug,
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
    },
  });

  if (!contest) {
    throw new Error("Contest not found");
  }

  const now = new Date();

  if (now >= contest.endTime) {
    throw new Error("Contest has already ended");
  }

  const existingRegistration =
    await prismaClient.contestRegistration.findUnique({
      where: {
        contestId_userId: {
          contestId: contest.id,
          userId,
        },
      },
    });

  if (existingRegistration) {
    throw new Error("Already registered for this contest");
  }

  return prismaClient.contestRegistration.create({
    data: {
      contestId: contest.id,
      userId,
    },
    select: {
      id: true,
      registeredAt: true,

      contest: {
        select: {
          title: true,
          slug: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  });
}
