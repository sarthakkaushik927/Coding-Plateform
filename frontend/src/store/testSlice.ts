import { createSlice, type PayloadAction } from '@reduxjs/toolkit';


interface TestState {
  submissionId: string | null;
  testId: string | null;
  currentQuestionIndex: number;
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  status: 'idle' | 'loading' | 'active' | 'completed' | 'error';
  timeRemaining: number; // in seconds
}

const initialState: TestState = {
  submissionId: null,
  testId: null,
  currentQuestionIndex: 0,
  answers: {},
  status: 'idle',
  timeRemaining: 0,
};

const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    startTest: (state, action: PayloadAction<{ submissionId: string; testId: string; duration: number; startedAt?: string }>) => {
      state.submissionId = action.payload.submissionId;
      state.testId = action.payload.testId;
      state.status = 'active';
      
      if (action.payload.startedAt) {
        const startTime = new Date(action.payload.startedAt).getTime();
        const durationMs = action.payload.duration * 60 * 1000;
        const now = Date.now();
        const remainingMs = Math.max(0, startTime + durationMs - now);
        state.timeRemaining = Math.floor(remainingMs / 1000);
      } else {
        state.timeRemaining = action.payload.duration * 60;
      }
    },
    setAnswer: (state, action: PayloadAction<{ questionId: string; answerIndex: number }>) => {
      state.answers[action.payload.questionId] = action.payload.answerIndex;
    },
    setCurrentQuestion: (state, action: PayloadAction<number>) => {
      state.currentQuestionIndex = action.payload;
    },
    updateTime: (state) => {
      if (state.timeRemaining > 0) {
        state.timeRemaining -= 1;
      }
    },
    completeTest: (state) => {
      state.status = 'completed';
      state.timeRemaining = 0;
    },
    setError: (state) => {
      state.status = 'error';
    }
  },
});

export const { startTest, setAnswer, setCurrentQuestion, updateTime, completeTest, setError } = testSlice.actions;
export default testSlice.reducer;
