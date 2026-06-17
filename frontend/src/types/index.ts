export interface Question {
  _id: string;
  questionText: string;
  options: string[];
  points: number;
  correctOptionIndex?: number;
}

export interface Test {
  _id: string;
  title: string;
  description: string;
  durationInMinutes: number;
  status: 'scheduled' | 'waiting' | 'active' | 'completed';
  startedAt?: string | null;
  completedAt?: string | null;
  questions: Question[];
}

export interface Submission {
  _id: string;
  candidateEmail: string;
  testId: string;
  answers: Record<string, number>;
  status: 'active' | 'completed';
}
