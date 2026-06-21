const axios = require('axios');

/**
 * Judge0 CE — free public instance, no API key required.
 * Docs: https://ce.judge0.com
 * Language IDs: https://ce.judge0.com/languages
 */
const JUDGE0_BASE = 'https://judge0-ce.p.rapidapi.com';

// Judge0 Language IDs
const LANGUAGE_MAP = {
  javascript: 63,   // Node.js 12.14.0
  python: 71,       // Python 3.8.1
  cpp: 54,          // C++ (GCC 9.2.0)
  c: 50,            // C (GCC 9.2.0)
  java: 62,         // Java (OpenJDK 13.0.1)
  typescript: 74,   // TypeScript 3.7.4
  csharp: 51,       // C# (Mono 6.6.0.161)
  go: 60,           // Go (1.13.5)
  rust: 73,         // Rust (1.40.0)
  ruby: 72,         // Ruby (2.7.0)
};

// Judge0 verdict status IDs
const STATUS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT_EXCEEDED: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_ERROR_SIGSEGV: 7,
  RUNTIME_ERROR_SIGXFSZ: 8,
  RUNTIME_ERROR_SIGFPE: 9,
  RUNTIME_ERROR_SIGABRT: 10,
  RUNTIME_ERROR_NZEC: 11,
  RUNTIME_ERROR_OTHER: 12,
  INTERNAL_ERROR: 13,
  EXEC_FORMAT_ERROR: 14,
};

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };

  // If a RapidAPI key is configured, use the RapidAPI endpoint
  if (process.env.JUDGE0_RAPIDAPI_KEY) {
    headers['X-RapidAPI-Key'] = process.env.JUDGE0_RAPIDAPI_KEY;
    headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
  }

  return headers;
};

const getBaseUrl = () => {
  if (process.env.JUDGE0_RAPIDAPI_KEY) {
    return 'https://judge0-ce.p.rapidapi.com';
  }
  // Fall back to free public CE instance
  return 'https://ce.judge0.com';
};

/**
 * Submit code to Judge0 and wait for the result.
 * @param {string} sourceCode - The code to run
 * @param {string} language - 'javascript' | 'python' | 'cpp' | 'java' | 'c' | 'typescript'
 * @param {string} stdin - Standard input for the program
 * @param {string} expectedOutput - Expected stdout (optional, for automatic grading)
 */
async function executeCode({ sourceCode, language, stdin = '', expectedOutput = '' }) {
  const languageId = LANGUAGE_MAP[language];
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_MAP).join(', ')}`);
  }

  const base = getBaseUrl();
  const headers = getHeaders();

  // Step 1: Submit
  const submitRes = await axios.post(
    `${base}/submissions?base64_encoded=false&wait=false`,
    {
      source_code: sourceCode,
      language_id: languageId,
      stdin,
      expected_output: expectedOutput || undefined,
      cpu_time_limit: 5,       // 5 seconds
      memory_limit: 128000,    // 128 MB
    },
    { headers, timeout: 10000 }
  );

  const token = submitRes.data.token;
  if (!token) throw new Error('Judge0 did not return a submission token.');

  // Step 2: Poll for result (max 10 tries, 1s apart)
  for (let attempt = 0; attempt < 10; attempt++) {
    await new Promise(r => setTimeout(r, 1000));

    const resultRes = await axios.get(
      `${base}/submissions/${token}?base64_encoded=false&fields=status,stdout,stderr,compile_output,time,memory`,
      { headers, timeout: 10000 }
    );

    const result = resultRes.data;
    const statusId = result.status?.id;

    if (statusId === STATUS.IN_QUEUE || statusId === STATUS.PROCESSING) {
      continue; // still running, keep polling
    }

    return {
      token,
      status: result.status?.description || 'Unknown',
      statusId,
      accepted: statusId === STATUS.ACCEPTED,
      stdout: result.stdout || '',
      stderr: result.stderr || result.compile_output || '',
      time: result.time || null,
      memory: result.memory || null,
    };
  }

  throw new Error('Code execution timed out. Please try again.');
}

/**
 * Run code against all test cases for a problem.
 * Returns per-testcase results and an overall pass count.
 */
async function runAgainstTestCases({ sourceCode, language, testCases }) {
  const results = [];

  for (const tc of testCases) {
    try {
      const res = await executeCode({
        sourceCode,
        language,
        stdin: tc.input,
        expectedOutput: tc.expectedOutput,
      });

      results.push({
        input: tc.isHidden ? '[Hidden]' : tc.input,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
        actualOutput: res.stdout.trim(),
        passed: res.accepted,
        status: res.status,
        time: res.time,
        stderr: res.stderr,
        isHidden: tc.isHidden,
      });
    } catch (err) {
      results.push({
        input: tc.isHidden ? '[Hidden]' : tc.input,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
        actualOutput: '',
        passed: false,
        status: 'Error',
        stderr: err.message,
        isHidden: tc.isHidden,
      });
    }
  }

  const passed = results.filter(r => r.passed).length;
  return { results, passed, total: results.length };
}

module.exports = { executeCode, runAgainstTestCases, LANGUAGE_MAP };
