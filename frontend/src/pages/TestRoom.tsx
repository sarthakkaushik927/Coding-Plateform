import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  startTest,
  setAnswer,
  setCurrentQuestion,
  toggleMarkQuestion,
  completeTest,
  setError
} from '../store/testSlice';
import testService, { createEventSourceUrl } from '../utils/apiService';
import type { Test } from '../types';

import QuestionCard from '../components/QuestionCard';
import NavigationControls from '../components/NavigationControls';
import CandidateQuestionPanel, { type CandidateQuestionState } from '../components/test/CandidateQuestionPanel';
import MarkReviewButton from '../components/test/MarkReviewButton';
import TestRoomHeader from '../components/test/TestRoomHeader';

const TestRoom: React.FC = () => {
  const { id: testId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    submissionId,
    currentQuestionIndex,
    answers,
    viewedQuestionIds,
    markedQuestionIds,
    status
  } = useSelector((state: RootState) => state.test);

  const { user } = useSelector((state: RootState) => state.auth);

  const [testData, setTestData] = useState<Test | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initTest = async () => {
      if (!testId) return;

      try {
        const testRes = await testService.getTest(testId);
        const test: Test = testRes.data;

        if (test.status !== 'active') {
          navigate('/dashboard');
          return;
        }

        setTestData(test);

        const email = user?.email || 'candidate@example.com';
        const name = user?.name || 'Candidate';
        const submissionRes = await testService.startSubmission(email, name, testId);

        dispatch(startTest({
          submissionId: submissionRes.data._id,
          testId,
          duration: test.durationInMinutes,
          startedAt: test.startedAt ?? undefined
        }));
        if (test.questions[0]?._id) {
          dispatch(setCurrentQuestion({ index: 0, questionId: test.questions[0]._id }));
        }
      } catch (error: unknown) {
        console.error('CRITICAL ERROR in initTest:', error);
        dispatch(setError());
      }
    };

    initTest();
  }, [testId, dispatch, navigate, user?.email, user?.name]);

  useEffect(() => {
    if (!testId) return;

    const eventSource = new EventSource(createEventSourceUrl(`/events/test/${testId}`));
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'AUTO_SUBMIT') {
        dispatch(completeTest());
      }
    };

    return () => {
      eventSource.close();
    };
  }, [dispatch, testId]);

  if (status === 'error') return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <h2 className="text-2xl font-serif text-red-800 mb-4">Initialization Error</h2>
        <p className="text-cream-600 mb-8 font-light">The assessment environment could not be established. Please contact your administrator.</p>
        <Link to="/dashboard" className="btn-primary">Return to Dashboard</Link>
      </div>
    </div>
  );

  if (!testData || status === 'loading') return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 border-2 border-cream-200 border-t-cream-900 rounded-full animate-spin"></div>
      <p className="mt-6 text-sm text-cream-400 uppercase tracking-widest font-bold">Establishing Secure Session...</p>
    </div>
  );

  if (status === 'completed') {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-2 border-cream-950 flex items-center justify-center text-cream-950 font-serif font-bold text-3xl mb-8">
          N
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400 mb-2">Protocol Finished</div>
        <h2 className="text-4xl font-serif text-cream-950 mb-4">Submission Confirmed</h2>
        <p className="text-cream-600 mb-12 max-w-md font-light italic">Your responses have been securely persisted. You may now exit the assessment environment.</p>
        <button onClick={() => navigate('/')} className="btn-primary">Return to Home</button>
      </div>
    );
  }

  const currentQuestion = testData.questions[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestion._id];
  const isCurrentMarked = Boolean(markedQuestionIds[currentQuestion._id]);

  const getCandidateQuestionState = (questionId: string): CandidateQuestionState => {
    const isAnswered = answers[questionId] !== undefined;
    const isMarked = Boolean(markedQuestionIds[questionId]);
    const isViewed = Boolean(viewedQuestionIds[questionId]);

    if (isMarked) return 'marked';
    if (isAnswered) return 'answered';
    if (isViewed) return 'viewed';
    return 'notViewed';
  };

  const answeredCount = testData.questions.filter((question) => answers[question._id] !== undefined).length;
  const markedCount = testData.questions.filter((question) => markedQuestionIds[question._id]).length;
  const viewedCount = testData.questions.filter((question) => viewedQuestionIds[question._id] && answers[question._id] === undefined).length;
  const notViewedCount = testData.questions.filter((question) => !viewedQuestionIds[question._id]).length;

  const handleSelectOption = (index: number) => {
    dispatch(setAnswer({ questionId: currentQuestion._id, answerIndex: index }));
  };

  const saveCurrentAnswer = async () => {
    if (!submissionId) return;

    if (selectedAnswer !== undefined) {
      await testService.saveAnswer(submissionId, currentQuestion._id, selectedAnswer);
    }
  };

  const goToQuestion = async (nextIndex: number) => {
    if (!testData.questions[nextIndex]) return;

    setIsSaving(true);
    try {
      await saveCurrentAnswer();
      dispatch(setCurrentQuestion({ index: nextIndex, questionId: testData.questions[nextIndex]._id }));
    } catch (error) {
      console.error('Failed to navigate question:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    goToQuestion(currentQuestionIndex + 1);
  };

  const handlePrevious = () => {
    goToQuestion(currentQuestionIndex - 1);
  };

  const handleToggleMark = () => {
    dispatch(toggleMarkQuestion(currentQuestion._id));
  };

  const handleSubmit = async () => {
    if (!submissionId) return;

    setIsSaving(true);
    try {
      await saveCurrentAnswer();

      await testService.completeSubmission(submissionId);
      dispatch(completeTest());
    } catch (error) {
      console.error('Final submission failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-cream-900">
      <TestRoomHeader candidateName={user?.name} />

      <main className="max-w-7xl mx-auto py-16 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10 items-start">
          <CandidateQuestionPanel
            questions={testData.questions}
            currentQuestionIndex={currentQuestionIndex}
            isSaving={isSaving}
            counts={{
              answered: answeredCount,
              marked: markedCount,
              viewed: viewedCount,
              notViewed: notViewedCount
            }}
            getQuestionState={getCandidateQuestionState}
            onQuestionSelect={goToQuestion}
          />

          <div>
            <header className="flex justify-between items-end mb-12">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400 mb-2">Live Assessment</div>
                <h1 className="text-3xl text-cream-950">{testData.title}</h1>
              </div>
              <div className="text-sm font-serif italic text-cream-500">
                Progress: <span className="font-bold text-cream-900">{currentQuestionIndex + 1}</span> of {testData.questions.length}
              </div>
            </header>

            <div className="relative">
              {isSaving && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-cream-400">
                  <span className="w-1.5 h-1.5 bg-cream-400 rounded-full animate-pulse"></span>
                  Syncing
                </div>
              )}

              <div className="flex justify-end mb-4">
                <MarkReviewButton isMarked={isCurrentMarked} onClick={handleToggleMark} />
              </div>
              
              <QuestionCard
                question={currentQuestion}
                selectedOption={selectedAnswer}
                onSelect={handleSelectOption}
              />

              <NavigationControls
                onPrevious={handlePrevious}
                onNext={handleNext}
                onSubmit={handleSubmit}
                isFirst={currentQuestionIndex === 0}
                isLast={currentQuestionIndex === testData.questions.length - 1}
                isLoading={isSaving}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="py-12 text-center">
        <p className="text-[10px] text-cream-300 uppercase tracking-[0.2em] font-bold">
          Encrypted Environment &bull; NextGen Protocol 4.0
        </p>
      </footer>
    </div>
  );
};

export default TestRoom;
