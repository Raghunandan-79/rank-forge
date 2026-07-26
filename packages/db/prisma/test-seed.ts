import { prismaClient, Difficulty, UserRole } from "../src/index";

async function main() {
  // 1. Create test user
  const user = await prismaClient.user.upsert({
    where: {
      email: "test@codearena.dev",
    },
    update: {},
    create: {
      username: "testuser",
      email: "test@codearena.dev",

      // Fine for local testing only.
      passwordHash: "test-password",

      role: UserRole.USER,
    },
  });

  console.log("User:", user.id);

  // 2. Create problem
  const problem = await prismaClient.problem.upsert({
    where: {
      slug: "add-two-numbers",
    },
    update: {},
    create: {
      title: "Add Two Numbers",
      slug: "add-two-numbers",
      description: "Given two integers a and b, print their sum.",

      difficulty: Difficulty.EASY,
    },
  });

  console.log("Problem:", problem.id);

  // Make script safe to run repeatedly
  await prismaClient.testCase.deleteMany({
    where: {
      problemId: problem.id,
    },
  });

  // 3. Add test cases
  await prismaClient.testCase.createMany({
    data: [
      {
        problemId: problem.id,
        input: "1 2",
        expectedOutput: "3",
        isHidden: false,
      },
      {
        problemId: problem.id,
        input: "10 20",
        expectedOutput: "30",
        isHidden: true,
      },
      {
        problemId: problem.id,
        input: "-5 8",
        expectedOutput: "3",
        isHidden: true,
      },
      {
        problemId: problem.id,
        input: "100 200",
        expectedOutput: "300",
        isHidden: true,
      },
    ],
  });

  console.log("Created 4 test cases");
  console.log("\nSeed completed!");
  console.log("User ID:", user.id);
  console.log("Problem ID:", problem.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
