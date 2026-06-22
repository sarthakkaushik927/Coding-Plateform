import testService, { getApiErrorMessage } from './apiService';
import {
  addPendingSync,
  loadTestSession,
  removePendingSync,
  saveTestSession,
  type PendingSyncItem,
  type TestSessionSnapshot,
} from './testSessionStorage';

const RETRY_DELAYS_MS = [500, 1000, 2000];

export interface SaveAnswerResult {
  success: boolean;
  error?: string;
}

async function attemptSave(
  submissionId: string,
  questionId: string,
  answerIndex: number
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      await testService.saveAnswer(submissionId, questionId, answerIndex);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < RETRY_DELAYS_MS.length) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
      }
    }
  }
  throw lastError;
}

export async function saveAnswerWithRetry(
  submissionId: string,
  testId: string,
  questionId: string,
  answerIndex: number,
  sessionBase?: Partial<TestSessionSnapshot>
): Promise<SaveAnswerResult> {
  try {
    await attemptSave(submissionId, questionId, answerIndex);
    removePendingSync(testId, submissionId, questionId);
    return { success: true };
  } catch (error) {
    addPendingSync(
      testId,
      submissionId,
      { questionId, answerIndex },
      sessionBase
    );
    return {
      success: false,
      error: getApiErrorMessage(error, 'Could not sync this answer. It is saved locally and will retry.'),
    };
  }
}

export async function flushPendingSync(
  submissionId: string,
  testId: string
): Promise<{ synced: number; failed: number }> {
  const snapshot = loadTestSession(testId, submissionId);
  if (!snapshot?.pendingSync.length) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining: PendingSyncItem[] = [];

  for (const item of snapshot.pendingSync) {
    try {
      await attemptSave(submissionId, item.questionId, item.answerIndex);
      removePendingSync(testId, submissionId, item.questionId);
      synced += 1;
    } catch {
      remaining.push(item);
      failed += 1;
    }
  }

  if (remaining.length) {
    saveTestSession({ ...snapshot, pendingSync: remaining, updatedAt: Date.now() });
  }

  return { synced, failed };
}
