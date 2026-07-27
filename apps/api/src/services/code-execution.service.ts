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

const LANGUAGE_MAP: Record<ProgrammingLanguage, number> = {
  [ProgrammingLanguage.C]: 50,
  [ProgrammingLanguage.CPP]: 54,
  [ProgrammingLanguage.JAVA]: 62,
  [ProgrammingLanguage.PYTHON]: 71,
  [ProgrammingLanguage.JAVASCRIPT]: 63,
};

// ------------------------------------------------
// Encode UTF-8 string to Base64
// ------------------------------------------------

function encodeBase64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

// ------------------------------------------------
// Decode Base64 response from Judge0
// ------------------------------------------------

function decodeBase64(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return Buffer.from(value, "base64").toString("utf8");
}

// ------------------------------------------------
// Sleep helper for polling
// ------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ------------------------------------------------
// Execute code using Judge0
// ------------------------------------------------

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

  const languageId = LANGUAGE_MAP[language];

  if (!languageId) {
    throw new Error(`Unsupported programming language: ${language}`);
  }

  // ------------------------------------------------
  // 1. Create Judge0 submission
  // ------------------------------------------------

  const response = await fetch(
    `${apiUrl}/submissions?base64_encoded=true&wait=false`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        source_code: encodeBase64(sourceCode),

        language_id: languageId,

        stdin: encodeBase64(input),

        // CPU time in seconds
        cpu_time_limit: timeLimit,

        // Small amount of additional CPU time
        cpu_extra_time: 1,

        // Wall time must be larger than CPU time
        wall_time_limit: Math.max(
          timeLimit * 2,
          timeLimit + 2,
        ),

        // Problem stores MB.
        // Judge0 expects KB.
        memory_limit: memoryLimit * 1024,
      }),
    },
  );

  // ------------------------------------------------
  // Handle Judge0 HTTP errors
  // ------------------------------------------------

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Judge0 request failed: ${response.status} ${body}`,
    );
  }

  // ------------------------------------------------
  // Judge0 returns a token
  // ------------------------------------------------

  const created = (await response.json()) as {
    token?: string;
  };

  if (!created.token) {
    throw new Error(
      "Judge0 did not return a submission token",
    );
  }

  console.log(`Judge0 token: ${created.token}`);

  // ------------------------------------------------
  // 2. Poll Judge0 until execution completes
  // ------------------------------------------------

  const maxAttempts = 30;
  const pollInterval = 500;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    const resultResponse = await fetch(
      `${apiUrl}/submissions/${created.token}?base64_encoded=true`,
    );

    // ------------------------------------------------
    // Handle polling HTTP errors
    // ------------------------------------------------

    if (!resultResponse.ok) {
      const body = await resultResponse.text();

      throw new Error(
        `Judge0 result request failed: ${resultResponse.status} ${body}`,
      );
    }

    const result =
      (await resultResponse.json()) as ExecutionResult;

    console.log(
      `Judge0 poll ${attempt}: ${result.status.description}`,
    );

    // ------------------------------------------------
    // Judge0 status:
    //
    // 1 = In Queue
    // 2 = Processing
    //
    // These are NOT final results.
    // ------------------------------------------------

    if (
      result.status.id === 1 ||
      result.status.id === 2
    ) {
      await sleep(pollInterval);

      continue;
    }

    // ------------------------------------------------
    // 3. Judge0 has reached a final state
    // ------------------------------------------------

    console.log(
      "=== FINAL RAW JUDGE0 RESULT ===",
    );

    console.dir(result, {
      depth: null,
    });

    // ------------------------------------------------
    // 4. Decode Base64 response fields
    // ------------------------------------------------

    const decodedResult: ExecutionResult = {
      ...result,

      stdout: decodeBase64(result.stdout),

      stderr: decodeBase64(result.stderr),

      compile_output: decodeBase64(
        result.compile_output,
      ),

      message: decodeBase64(result.message),
    };

    console.log(
      "=== DECODED JUDGE0 RESULT ===",
    );

    console.dir(decodedResult, {
      depth: null,
    });

    // ------------------------------------------------
    // 5. Return final result to BullMQ worker
    // ------------------------------------------------

    return decodedResult;
  }

  // ------------------------------------------------
  // Judge0 never reached a final state
  // ------------------------------------------------

  throw new Error(
    `Judge0 polling timed out for token ${created.token}`,
  );
}