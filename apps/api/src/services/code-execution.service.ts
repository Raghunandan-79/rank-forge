import { ProgrammingLanguage } from "@repo/db/client";

export type ExecutionResult = {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  time: string | null;
  memory: number | null;
  token: string;
  status: {
    id: number;
    description: string;
  };
};

type SubmissionCreatedResponse = {
  token: string;
};

const LANGUAGE_MAP: Record<ProgrammingLanguage, number> = {
  [ProgrammingLanguage.C]: 50,
  [ProgrammingLanguage.CPP]: 54,
  [ProgrammingLanguage.JAVA]: 62,
  [ProgrammingLanguage.PYTHON]: 71,
  [ProgrammingLanguage.JAVASCRIPT]: 63,
};

// Judge0:
// 1 = In Queue
// 2 = Processing
// >= 3 = Finished
const JUDGE0_PENDING_STATUSES = new Set([1, 2]);

const POLL_INTERVAL_MS = 300;

// This prevents our BullMQ worker from polling Judge0 forever.
// This is NOT the code execution time limit.
const MAX_POLL_TIME_MS = 15_000;

function encodeBase64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

function decodeBase64(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return Buffer.from(value, "base64").toString("utf8");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeExecutionResult(result: ExecutionResult): ExecutionResult {
  return {
    ...result,
    stdout: decodeBase64(result.stdout),
    stderr: decodeBase64(result.stderr),
    compile_output: decodeBase64(result.compile_output),
    message: decodeBase64(result.message),
  };
}

export async function executeCode(
  sourceCode: string,
  language: ProgrammingLanguage,
  input: string,
  timeLimit: number,
  memoryLimit: number,
): Promise<ExecutionResult> {
  const apiUrl = process.env.JUDGE0_URL;

  if (!apiUrl) {
    throw new Error("JUDGE0_URL is missing");
  }

  // Create submission asynchronously
  const response = await fetch(
    `${apiUrl}/submissions?base64_encoded=true&wait=false`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        source_code: encodeBase64(sourceCode),
        language_id: LANGUAGE_MAP[language],
        stdin: encodeBase64(input),

        // Per-problem execution limits
        cpu_time_limit: timeLimit,

        // Small grace period after CPU limit
        cpu_extra_time: 1,

        // Wall time should be slightly higher than CPU time
        wall_time_limit: timeLimit + 3,

        // CodeArena stores MB.
        // Judge0 expects KB.
        memory_limit: memoryLimit * 1024,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();

    throw new Error(`Judge0 submission failed: ${response.status} ${body}`);
  }

  const submission = (await response.json()) as SubmissionCreatedResponse;

  if (!submission.token) {
    throw new Error("Judge0 did not return a submission token");
  }

  return pollSubmission(apiUrl, submission.token);
}

async function pollSubmission(
  apiUrl: string,
  token: string,
): Promise<ExecutionResult> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < MAX_POLL_TIME_MS) {
    const response = await fetch(
      `${apiUrl}/submissions/${token}?base64_encoded=true`,
    );

    if (!response.ok) {
      const body = await response.text();

      throw new Error(`Judge0 polling failed: ${response.status} ${body}`);
    }

    const result = (await response.json()) as ExecutionResult;

    // Status 1 = In Queue
    // Status 2 = Processing
    if (!JUDGE0_PENDING_STATUSES.has(result.status.id)) {
      return decodeExecutionResult(result);
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(
    `Judge0 polling timed out after ${MAX_POLL_TIME_MS}ms for token ${token}`,
  );
}
