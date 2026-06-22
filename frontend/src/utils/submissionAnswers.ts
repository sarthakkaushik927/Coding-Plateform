export function normalizeSubmissionAnswers(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') return {};

  const result: Record<string, number> = {};
  for (const [questionId, value] of Object.entries(raw as Record<string, unknown>)) {
    const index = typeof value === 'number' ? value : Number(value);
    if (!Number.isNaN(index)) {
      result[questionId] = index;
    }
  }
  return result;
}

export function deriveViewedFromAnswers(
  answers: Record<string, number>,
  existing: Record<string, boolean> = {}
): Record<string, boolean> {
  const viewed = { ...existing };
  for (const questionId of Object.keys(answers)) {
    viewed[questionId] = true;
  }
  return viewed;
}
