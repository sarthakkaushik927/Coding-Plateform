import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const testService = {
  signup: (name: string, email: string) => api.post('/auth/signup', { name, email }),
  verifyOTP: (name: string, email: string, otp: string) => api.post('/auth/verify', { name, email, otp }),
  resendOTP: (email: string) => api.post('/auth/resend-otp', { email }),
  login: (email: string) => api.post('/auth/login', { email }),

  getAvailableTests: () => api.get('/tests/available'),
  getTest: (id: string) => api.get(`/test/${id}`),

  startSubmission: (candidateEmail: string, candidateName: string, testId: string) =>
    api.post('/submission/start', { candidateEmail, candidateName, testId }),

  saveAnswer: (submissionId: string, questionId: string, answerIndex: number) =>
    api.post(`/submission/${submissionId}/save-answer`, { questionId, answerIndex }),

  completeSubmission: (submissionId: string) =>
    api.post(`/submission/${submissionId}/complete`),

  createTest: (testData: any) => api.post('/admin/test', testData),
  openWaitingRoom: (testId: string) => api.post(`/admin/test/${testId}/open-waiting-room`),
  startTest: (testId: string) => api.post(`/admin/test/${testId}/start`),
  completeTest: (testId: string) => api.post(`/admin/test/${testId}/complete`),
  autoSubmitTest: (testId: string) => api.post(`/admin/test/${testId}/auto-submit`),

  getTestHistory: () => api.get('/admin/tests/history'),
  getWaitingQueues: () => api.get('/admin/tests/queues'),
  getTestResults: (testId: string) => api.get(`/admin/test/${testId}/results`),
  getSubmissionDetails: (subId: string) => api.get(`/admin/submission/${subId}`),
};

export default testService;
