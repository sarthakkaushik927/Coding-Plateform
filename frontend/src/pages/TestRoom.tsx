import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  startTest,
  setAnswer,
  clearAnswer,
  setCurrentQuestion,
  toggleMarkQuestion,
  completeTest,
  setError
} from '../store/testSlice';
import testService, { createEventSourceUrl } from '../utils/apiService';
import type { Test } from '../types';

import QuestionCard from '../components/QuestionCard';
import CandidateQuestionPanel, { type CandidateQuestionState } from '../components/test/CandidateQuestionPanel';
import QuestionActionBar from '../components/test/QuestionActionBar';
import SubmitConfirmModal from '../components/test/SubmitConfirmModal';
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
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);

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

  // --- Error / Loading / Completed states ---

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

  // --- Derived state ---

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

  const answeredCount = testData.questions.filter((q) => answers[q._id] !== undefined).length;
  const markedCount = testData.questions.filter((q) => markedQuestionIds[q._id]).length;
  const viewedCount = testData.questions.filter((q) => viewedQuestionIds[q._id] && answers[q._id] === undefined).length;
  const notViewedCount = testData.questions.filter((q) => !viewedQuestionIds[q._id]).length;

  // --- Handlers ---

  const handleSelectOption = (index: number) => {
    dispatch(setAnswer({ questionId: currentQuestion._id, answerIndex: index }));
  };

  const handleClearResponse = async () => {
    if (!submissionId) return;

    setIsSaving(true);
    try {
      await testService.clearAnswer(submissionId, currentQuestion._id);
      dispatch(clearAnswer(currentQuestion._id));
    } catch (error) {
      console.error('Failed to clear answer:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveCurrentAnswer = async () => {
    if (!submissionId || selectedAnswer === undefined) return;
    await testService.saveAnswer(submissionId, currentQuestion._id, selectedAnswer);
  };

  const goToQuestion = async (nextIndex: number) => {
    if (!testData.questions[nextIndex]) return;

    setIsSaving(true);
    try {
      await saveCurrentAnswer();
      dispatch(setCurrentQuestion({ index: nextIndex, questionId: testData.questions[nextIndex]._id }));
      setShowMobilePanel(false);
    } catch (error) {
      console.error('Failed to navigate question:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndNext = () => {
    goToQuestion(currentQuestionIndex + 1);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveCurrentAnswer();
    } catch (error) {
      console.error('Failed to save answer:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrevious = () => {
    goToQuestion(currentQuestionIndex - 1);
  };

  const handleToggleMark = () => {
    dispatch(toggleMarkQuestion(currentQuestion._id));
  };

  const handleOpenSubmitModal = async () => {
    setIsSaving(true);
    try {
      await saveCurrentAnswer();
    } catch (error) {
      console.error('Failed to save before submit:', error);
    } finally {
      setIsSaving(false);
    }
    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!submissionId) return;

    setIsSaving(true);
    try {
      await testService.completeSubmission(submissionId);
      dispatch(completeTest());
    } catch (error) {
      console.error('Final submission failed:', error);
    } finally {
      setIsSaving(false);
      setShowSubmitModal(false);
    }
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-cream-900 pb-20 lg:pb-0">
      <TestRoomHeader candidateName={user?.name} />

      <main className="max-w-7xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-10 items-start">

          {/* Desktop Sidebar — hidden on mobile */}
          <div className="hidden lg:flex flex-col gap-4 sticky top-8" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
            <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
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
            </div>

            <button
              onClick={handleOpenSubmitModal}
              disabled={isSaving}
              className="w-full shrink-0 py-3.5 bg-emerald-800 text-white text-[11px] font-black uppercase tracking-widest rounded-sm border border-emerald-900 transition-all hover:bg-emerald-900 hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Submit Assessment
            </button>
          </div>

          {/* Right Content — Question + Actions */}
          <div>
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 sm:mb-8 gap-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400 mb-1 sm:mb-2">Live Assessment</div>
                <h1 className="text-xl sm:text-3xl text-cream-950">{testData.title}</h1>
              </div>
              <div className="text-xs sm:text-sm font-serif italic text-cream-500">
                Question: <span className="font-bold text-cream-900">{currentQuestionIndex + 1}</span> of {testData.questions.length}
              </div>
            </header>

            <div className="relative">
              {isSaving && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-cream-400">
                  <span className="w-1.5 h-1.5 bg-cream-400 rounded-full animate-pulse"></span>
                  Syncing
                </div>
              )}

              <QuestionCard
                question={currentQuestion}
                selectedOption={selectedAnswer}
                onSelect={handleSelectOption}
              />

              <QuestionActionBar
                isMarked={isCurrentMarked}
                hasAnswer={selectedAnswer !== undefined}
                isSaving={isSaving}
                onToggleMark={handleToggleMark}
                onClearResponse={handleClearResponse}
                onSaveAndNext={handleSaveAndNext}
                onSave={handleSave}
                onPrevious={handlePrevious}
                isFirst={currentQuestionIndex === 0}
                isLast={currentQuestionIndex === testData.questions.length - 1}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Bar — fixed at bottom, visible on small screens */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-cream-200 px-4 py-3 flex items-center justify-between gap-3 lg:hidden z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setShowMobilePanel(!showMobilePanel)}
          className="flex items-center gap-2 px-3 py-2.5 border border-cream-200 rounded-sm text-[10px] font-black uppercase tracking-widest text-cream-700 bg-cream-50 hover:bg-cream-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Q {currentQuestionIndex + 1}/{testData.questions.length}
        </button>

        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-cream-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {answeredCount}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {markedCount}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            {notViewedCount}
          </span>
        </div>

        <button
          onClick={handleOpenSubmitModal}
          disabled={isSaving}
          className="px-4 py-2.5 bg-emerald-800 text-white text-[10px] font-black uppercase tracking-widest rounded-sm border border-emerald-900 transition-all hover:bg-emerald-900 disabled:opacity-50 flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Submit
        </button>
      </div>

      {/* Mobile Question Panel Drawer */}
      {showMobilePanel && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-cream-950/50 backdrop-blur-sm" onClick={() => setShowMobilePanel(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-cream-200 rounded-t-2xl max-h-[75vh] overflow-y-auto animate-slide-up p-4 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400">Question Panel</div>
              <button
                onClick={() => setShowMobilePanel(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-cream-100 text-cream-600 hover:bg-cream-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

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
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      <SubmitConfirmModal
        isOpen={showSubmitModal}
        isSubmitting={isSaving}
        summary={{
          total: testData.questions.length,
          answered: answeredCount,
          notAnswered: testData.questions.length - answeredCount,
          marked: markedCount,
          notViewed: notViewedCount,
        }}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowSubmitModal(false)}
      />

      <footer className="hidden lg:block py-12 text-center">
        <p className="text-[10px] text-cream-300 uppercase tracking-[0.2em] font-bold">
          Encrypted Environment &bull; NextGen Protocol 4.0
        </p>
      </footer>
    </div>
  );
};

export default TestRoom;
