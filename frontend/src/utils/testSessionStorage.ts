export interface PendingSyncItem {
  questionId: string;
  answerIndex: number;
}

export interface TestSessionSnapshot {
  submissionId: string;
  testId: string;
  answers: Record<string, number>;
  markedQuestionIds: Record<string, boolean>;
  viewedQuestionIds: Record<string, boolean>;
  currentQuestionIndex: number;
  pendingSync: PendingSyncItem[];
  updatedAt: number;
}

const storageKey = (testId: string, submissionId: string) =>
  `test-session:${testId}:${submissionId}`;

export function loadTestSession(testId: string, submissionId: string): TestSessionSnapshot | null {
  try {
    const raw = sessionStorage.getItem(storageKey(testId, submissionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TestSessionSnapshot;
    if (parsed.submissionId !== submissionId || parsed.testId !== testId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveTestSession(snapshot: TestSessionSnapshot): void {
  try {
    sessionStorage.setItem(
      storageKey(snapshot.testId, snapshot.submissionId),
      JSON.stringify({ ...snapshot, updatedAt: Date.now() })
    );
  } catch {
    // sessionStorage may be full or unavailable
  }
}

export function clearTestSession(testId: string, submissionId: string): void {
  try {
    sessionStorage.removeItem(storageKey(testId, submissionId));
  } catch {
    // ignore
  }
}

export function mergeTestSession(
  serverAnswers: Record<string, number>,
  local: TestSessionSnapshot | null,
  questionCount: number
): {
  answers: Record<string, number>;
  markedQuestionIds: Record<string, boolean>;
  viewedQuestionIds: Record<string, boolean>;
  currentQuestionIndex: number;
  pendingSync: PendingSyncItem[];
} {
  const pendingIds = new Set(local?.pendingSync.map((item) => item.questionId) ?? []);
  const answers = { ...serverAnswers };

  if (local) {
    for (const [questionId, answerIndex] of Object.entries(local.answers)) {
      if (pendingIds.has(questionId) || serverAnswers[questionId] === undefined) {
        answers[questionId] = answerIndex;
      }
    }
    for (const item of local.pendingSync) {
      answers[item.questionId] = item.answerIndex;
    }
  }

  const viewedQuestionIds = { ...(local?.viewedQuestionIds ?? {}) };
  for (const questionId of Object.keys(answers)) {
    viewedQuestionIds[questionId] = true;
  }

  const maxIndex = Math.max(0, questionCount - 1);
  const currentQuestionIndex = Math.min(local?.currentQuestionIndex ?? 0, maxIndex);

  return {
    answers,
    markedQuestionIds: local?.markedQuestionIds ?? {},
    viewedQuestionIds,
    currentQuestionIndex,
    pendingSync: local?.pendingSync ?? [],
  };
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function saveTestSessionDebounced(snapshot: TestSessionSnapshot, delayMs = 300): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    saveTestSession(snapshot);
    debounceTimer = null;
  }, delayMs);
}

export function addPendingSync(
  testId: string,
  submissionId: string,
  item: PendingSyncItem,
  base?: Partial<TestSessionSnapshot>
): PendingSyncItem[] {
  const existing = loadTestSession(testId, submissionId);
  const pendingSync = [...(existing?.pendingSync ?? [])];
  const idx = pendingSync.findIndex((entry) => entry.questionId === item.questionId);
  if (idx >= 0) {
    pendingSync[idx] = item;
  } else {
    pendingSync.push(item);
  }

  if (existing || base) {
    saveTestSession({
      submissionId,
      testId,
      answers: base?.answers ?? existing?.answers ?? {},
      markedQuestionIds: base?.markedQuestionIds ?? existing?.markedQuestionIds ?? {},
      viewedQuestionIds: base?.viewedQuestionIds ?? existing?.viewedQuestionIds ?? {},
      currentQuestionIndex: base?.currentQuestionIndex ?? existing?.currentQuestionIndex ?? 0,
      pendingSync,
      updatedAt: Date.now(),
    });
  }

  return pendingSync;
}

export function removePendingSync(
  testId: string,
  submissionId: string,
  questionId: string
): void {
  const existing = loadTestSession(testId, submissionId);
  if (!existing) return;

  saveTestSession({
    ...existing,
    pendingSync: existing.pendingSync.filter((item) => item.questionId !== questionId),
    updatedAt: Date.now(),
  });
}
