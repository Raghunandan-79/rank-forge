import { prismaClient } from "@repo/db/client";
import type {
  AddContestProblemInput,
  CreateContestInput,
} from "../schemas/schemas";
import { bullmqRedis, redis } from "../config/redis";

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

export async function deleteContestService(slug: string) {
  const contest = await prismaClient.contest.findUnique({
    where: {
      slug,
    },
  });

  if (!contest) {
    throw new Error("Contest not found");
  }

  return prismaClient.contest.delete({
    where: {
      slug,
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

export async function getContestLeaderboardService(slug: string) {
  const contest = await prismaClient.contest.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      title: true,
      slug: true,
    },
  });

  if (!contest) {
    throw new Error("Contest not found");
  }

  const leaderboardKey = `leaderboard:contest:${contest.id}`;

  // ---------------------------------------------
  // Try Redis first
  // ---------------------------------------------

  let redisLeaderboard = await redis.zrevrange(
    leaderboardKey,
    0,
    -1,
    "WITHSCORES",
  );

  // ---------------------------------------------
  // Redis empty -> rebuild from PostgreSQL
  // ---------------------------------------------

  if (redisLeaderboard.length === 0) {
    await rebuildContestLeaderboard(contest.id);

    redisLeaderboard = await redis.zrevrange(
      leaderboardKey,
      0,
      -1,
      "WITHSCORES",
    );
  }

  // ---------------------------------------------
  // Convert Redis response
  // [userId, score, userId, score, ...]
  // ---------------------------------------------

  const entries: {
    userId: string;
    score: number;
  }[] = [];

  for (let i = 0; i < redisLeaderboard.length; i += 2) {
    const userId = redisLeaderboard[i];
    const score = redisLeaderboard[i + 1];

    if (!userId || score === undefined) {
      continue;
    }

    entries.push({
      userId,
      score: Number(score),
    });
  }

  // ---------------------------------------------
  // Fetch usernames
  // ---------------------------------------------

  const users = await prismaClient.user.findMany({
    where: {
      id: {
        in: entries.map((entry) => entry.userId),
      },
    },
    select: {
      id: true,
      username: true,
    },
  });

  const usernameMap = new Map(users.map((user) => [user.id, user.username]));

  // ---------------------------------------------
  // Final leaderboard
  // ---------------------------------------------

  const leaderboard = entries.map((entry, index) => ({
    rank: index + 1,
    userId: entry.userId,
    username: usernameMap.get(entry.userId) ?? "Unknown",
    score: entry.score,
  }));

  return {
    contest: {
      title: contest.title,
      slug: contest.slug,
    },
    leaderboard,
  };
}

export async function getContestStandingsService(slug: string) {
  const contest = await prismaClient.contest.findUnique({
    where: {
      slug,
    },

    select: {
      id: true,
      title: true,
      slug: true,

      // ---------------------------------------------
      // Contest problems
      // ---------------------------------------------

      problems: {
        orderBy: {
          index: "asc",
        },

        select: {
          index: true,
          points: true,
          problemId: true,

          problem: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      },

      // ---------------------------------------------
      // Registered users
      // ---------------------------------------------

      registrations: {
        select: {
          userId: true,

          user: {
            select: {
              username: true,
            },
          },
        },
      },

      // ---------------------------------------------
      // Contest scores
      // ---------------------------------------------

      contestScores: {
        select: {
          userId: true,
          problemId: true,
          points: true,
          penalty: true,
          solvedAt: true,

          user: {
            select: {
              username: true,
            },
          },
        },
      },
    },
  });

  if (!contest) {
    throw new Error("Contest not found");
  }

  // ---------------------------------------------
  // Standings map
  // ---------------------------------------------

  const users = new Map<
    string,
    {
      userId: string;
      username: string;
      score: number;
      penalty: number;

      problems: Record<
        string,
        {
          solved: boolean;
          points: number;
          penalty: number;
          solvedAt: Date | null;
        }
      >;
    }
  >();
  // ---------------------------------------------
  // Add every registered user
  // They initially have 0 points
  // ---------------------------------------------

  for (const registration of contest.registrations) {
    users.set(registration.userId, {
      userId: registration.userId,
      username: registration.user.username,
      score: 0,
      penalty: 0,
      problems: {},
    });
  }

  // ---------------------------------------------
  // Apply contest scores
  // ---------------------------------------------

  for (const score of contest.contestScores) {
    let standing = users.get(score.userId);

    // Fallback for old data where someone has a score
    // but does not have a ContestRegistration
    if (!standing) {
      standing = {
        userId: score.userId,
        username: score.user.username,
        score: 0,
        penalty: 0,
        problems: {},
      };

      users.set(score.userId, standing);
    }

    // Add score
    standing.score += score.points;
    standing.penalty += score.penalty;

    // Find A / B / C / ...
    const contestProblem = contest.problems.find(
      (cp) => cp.problemId === score.problemId,
    );

    if (!contestProblem) {
      continue;
    }

    // Mark problem as solved
    standing.problems[contestProblem.index] = {
      solved: true,
      points: score.points,
      penalty: score.penalty,
      solvedAt: score.solvedAt,
    };
  }

  // ---------------------------------------------
  // Sort standings
  // Highest score first
  // ---------------------------------------------

  const standings = Array.from(users.values())
  .sort((a, b) => {
    // Higher score first
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    // Same score -> lower penalty first
    return a.penalty - b.penalty;
  })
  .map((user, index) => ({
    rank: index + 1,
    ...user,
  }));

  // ---------------------------------------------
  // Response
  // ---------------------------------------------

  return {
    contest: {
      title: contest.title,
      slug: contest.slug,
    },

    problems: contest.problems.map((cp) => ({
      index: cp.index,
      title: cp.problem.title,
      slug: cp.problem.slug,
      points: cp.points,
    })),

    standings,
  };
}

export async function rebuildContestLeaderboard(contestId: string) {
  const scores = await prismaClient.contestScore.groupBy({
    by: ["userId"],
    where: {
      contestId,
    },
    _sum: {
      points: true,
    },
  });

  const key = `leaderboard:contest:${contestId}`;

  // Remove stale Redis leaderboard
  await redis.del(key);

  if (scores.length === 0) {
    return;
  }

  const pipeline = redis.pipeline();

  for (const score of scores) {
    pipeline.zadd(key, score._sum.points ?? 0, score.userId);
  }

  await pipeline.exec();

  console.log(
    `Leaderboard rebuilt: contest=${contestId}, users=${scores.length}`,
  );
}
