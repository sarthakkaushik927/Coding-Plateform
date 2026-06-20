import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import testService from '../../utils/apiService';

interface Question {
  _id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
}

interface SubmissionDetail {
  _id: string;
  candidateName: string;
  candidateEmail: string;
  score: number;
  answers: Record<string, number>;
  testId: {
    title: string;
    questions: Question[];
  };
}

type QuestionReviewState = 'correct' | 'wrong' | 'unanswered';

const getQuestionState = (question: Question, answers: Record<string, number>): QuestionReviewState => {
  const candidateAnswer = answers[question._id];

  if (candidateAnswer === undefined) {
    return 'unanswered';
  }

  return candidateAnswer === question.correctOptionIndex ? 'correct' : 'wrong';
};

const questionStateStyles: Record<QuestionReviewState, string> = {
  correct: 'bg-green-600 border-green-700 text-white',
  wrong: 'bg-red-600 border-red-700 text-white',
  unanswered: 'bg-slate-100 border-slate-300 text-slate-500'
};

const questionStateLabels: Record<QuestionReviewState, string> = {
  correct: 'Correct',
  wrong: 'Wrong',
  unanswered: 'Not Answered'
};

const DetailedResult: React.FC = () => {
  const { subId } = useParams<{ subId: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!subId) return;
      try {
        const res = await testService.getSubmissionDetails(subId);
        setSubmission(res.data);
      } catch (err) {
        console.error('Failed to fetch details', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [subId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-2 border-cream-200 border-t-cream-900 rounded-full animate-spin"></div>
        <p className="mt-6 text-[10px] text-cream-400 uppercase tracking-widest font-bold">Loading Audit File...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-serif text-red-800 mb-4">Record Not Found</h2>
        <button onClick={() => navigate(-1)} className="btn-primary">Return</button>
      </div>
    );
  }

  const questionStates = submission.testId.questions.map((question) => getQuestionState(question, submission.answers));
  const correctCount = questionStates.filter((state) => state === 'correct').length;
  const wrongCount = questionStates.filter((state) => state === 'wrong').length;
  const unansweredCount = questionStates.filter((state) => state === 'unanswered').length;

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-cream-900 pb-32">
      <nav className="bg-white border-b border-cream-200 mb-16">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-cream-950 flex items-center justify-center text-cream-950 font-serif font-bold text-lg">
              N
            </div>
            <span className="text-lg font-serif font-bold text-cream-950 tracking-wide">NextGen Audit</span>
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="text-xs uppercase tracking-widest font-bold text-cream-500 hover:text-cream-950 transition-colors"
          >
            Back to Results
          </button>
        </div>
      </nav>

      <header className="max-w-4xl mx-auto px-6 mb-16">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between md:items-end border-b border-cream-200 pb-12">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400 mb-2">Candidate File</div>
            <h1 className="text-5xl font-serif text-cream-950 mb-2">{submission.candidateName}</h1>
            <p className="text-cream-500 font-light italic text-lg mb-6">{submission.candidateEmail}</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cream-100 border border-cream-200 rounded-full">
              <span className="w-1.5 h-1.5 bg-cream-900 rounded-full"></span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-cream-900">{submission.testId.title}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-cream-400 uppercase tracking-widest mb-1">Final Score</div>
            <div className="text-7xl font-serif text-cream-900">{submission.score}</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 items-start">
          <aside className="lg:sticky lg:top-8 space-y-6">
            <section className="bg-white border border-cream-200 rounded-sm shadow-sm p-6">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400 mb-4">Question Board</div>
              <div className="grid grid-cols-5 gap-3">
                {submission.testId.questions.map((question, index) => {
                  const state = questionStates[index];

                  return (
                    <a
                      key={question._id}
                      href={`#question-${question._id}`}
                      title={`Question ${index + 1}: ${questionStateLabels[state]}`}
                      className={`h-10 w-10 border rounded-sm flex items-center justify-center text-xs font-black transition-transform hover:-translate-y-0.5 ${questionStateStyles[state]}`}
                    >
                      {index + 1}
                    </a>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6 text-center">
                <div className="bg-green-50 border border-green-100 p-3 rounded-sm">
                  <div className="text-xl font-serif text-green-800">{correctCount}</div>
                  <div className="text-[8px] uppercase tracking-widest font-black text-green-700">Correct</div>
                </div>
                <div className="bg-red-50 border border-red-100 p-3 rounded-sm">
                  <div className="text-xl font-serif text-red-800">{wrongCount}</div>
                  <div className="text-[8px] uppercase tracking-widest font-black text-red-700">Wrong</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-sm">
                  <div className="text-xl font-serif text-slate-700">{unansweredCount}</div>
                  <div className="text-[8px] uppercase tracking-widest font-black text-slate-500">Blank</div>
                </div>
              </div>
            </section>

            <section className="bg-white border border-cream-200 rounded-sm shadow-sm p-6">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400 mb-4">Instructions</div>
              <div className="space-y-3 text-xs text-cream-600 leading-relaxed">
                <p>Use the numbered board to jump directly to any question.</p>
                <p><span className="font-bold text-green-700">Green</span> means the selected answer is correct.</p>
                <p><span className="font-bold text-red-700">Red</span> means the selected answer is wrong.</p>
                <p><span className="font-bold text-slate-600">Grey</span> means no answer was submitted.</p>
              </div>

              <div className="mt-6 pt-6 border-t border-cream-100 space-y-3">
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-cream-500">
                  <span className="w-4 h-4 bg-green-600 border border-green-700 rounded-sm"></span>
                  Marked / Viewed
                </div>
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-cream-500">
                  <span className="w-4 h-4 bg-slate-100 border border-slate-300 rounded-sm"></span>
                  Unmarked / Not Viewed
                </div>
              </div>

              <div className="mt-6 text-[10px] text-cream-400 leading-relaxed">
                Viewed and marked status is inferred from saved answers because the test currently stores final responses only.
              </div>
            </section>
          </aside>

          <section className="space-y-12">
            {submission.testId.questions.map((q, index) => {
              const candidateAns = submission.answers[q._id];
              const isAnswered = candidateAns !== undefined;
              const isCorrect = candidateAns === q.correctOptionIndex;
              const candidateAnswerText = isAnswered ? q.options[candidateAns] : 'No answer submitted';
              const correctAnswerText = q.options[q.correctOptionIndex];

              return (
                <div
                  id={`question-${q._id}`}
                  key={q._id}
                  className="bg-white p-10 rounded-sm border border-cream-200 shadow-sm scroll-mt-8"
                >
                  <div className="flex justify-between items-start mb-8 gap-6">
                    <h3 className="text-2xl font-serif flex gap-6">
                      <span className="text-cream-300 font-sans font-bold text-lg">Q{index + 1}</span>
                      <span className="text-cream-950">{q.questionText}</span>
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      !isAnswered
                        ? 'bg-slate-50 border-slate-200 text-slate-600'
                        : isCorrect
                          ? 'bg-green-50 border-green-100 text-green-700'
                          : 'bg-red-50 border-red-100 text-red-700'
                    }`}>
                      {!isAnswered ? 'Not Answered' : isCorrect ? 'Passed' : 'Failed'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className={`p-5 rounded-sm border-2 ${
                      isCorrect ? 'bg-green-50 border-green-600' : isAnswered ? 'bg-red-50 border-red-600' : 'bg-slate-50 border-slate-300'
                    }`}>
                      <div className="text-[9px] uppercase tracking-[0.25em] font-black mb-2 text-cream-500">Candidate Chose</div>
                      <div className={`text-sm font-bold ${isCorrect ? 'text-green-800' : isAnswered ? 'text-red-800' : 'text-slate-600'}`}>
                        {candidateAnswerText}
                      </div>
                    </div>

                    <div className="p-5 rounded-sm border-2 bg-green-50 border-green-600">
                      <div className="text-[9px] uppercase tracking-[0.25em] font-black mb-2 text-cream-500">Correct Answer</div>
                      <div className="text-sm font-bold text-green-800">{correctAnswerText}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, oIndex) => {
                      const isCandidateChoice = candidateAns === oIndex;
                      const isCorrectChoice = q.correctOptionIndex === oIndex;

                      let style = 'bg-cream-50 border-cream-100 text-cream-400';
                      if (isCorrectChoice) style = 'bg-white border-green-600 text-green-700 ring-1 ring-green-600 ring-offset-2';
                      if (isCandidateChoice && !isCorrect) style = 'bg-white border-red-600 text-red-700 ring-1 ring-red-600 ring-offset-2';

                      return (
                        <div key={oIndex} className={`p-4 rounded-sm border flex items-center justify-between gap-4 text-sm transition-all ${style}`}>
                          <span className={isCorrectChoice || isCandidateChoice ? 'font-bold' : 'font-light'}>{opt}</span>
                          <div className="flex flex-wrap justify-end gap-2">
                            {isCandidateChoice && (
                              <span className={`text-[8px] uppercase font-black tracking-widest px-2 py-1 rounded-full ${
                                isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                Candidate Pick
                              </span>
                            )}
                            {isCorrectChoice && (
                              <span className="text-[8px] uppercase font-black tracking-widest px-2 py-1 rounded-full bg-green-100 text-green-800">
                                Correct
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </main>
    </div>
  );
};

export default DetailedResult;
