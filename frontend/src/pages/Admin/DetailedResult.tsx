import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

      <main className="max-w-4xl mx-auto px-6 space-y-12">
        {submission.testId.questions.map((q, index) => {
          const candidateAns = submission.answers[q._id];
          const isCorrect = candidateAns === q.correctOptionIndex;

          return (
            <div
              key={q._id}
              className="bg-white p-10 rounded-sm border border-cream-200 shadow-sm"
            >
              <div className="flex justify-between items-start mb-8 gap-6">
                <h3 className="text-2xl font-serif flex gap-6">
                  <span className="text-cream-300 font-sans font-bold text-lg">Q{index + 1}</span>
                  <span className="text-cream-950">{q.questionText}</span>
                </h3>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  isCorrect ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                }`}>
                  {isCorrect ? 'Passed' : 'Failed'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((opt, oIndex) => {
                  const isCandidateChoice = candidateAns === oIndex;
                  const isCorrectChoice = q.correctOptionIndex === oIndex;

                  let style = 'bg-cream-50 border-cream-100 text-cream-400';
                  if (isCorrectChoice) style = 'bg-white border-green-600 text-green-700 ring-1 ring-green-600 ring-offset-2';
                  if (isCandidateChoice && !isCorrect) style = 'bg-white border-red-600 text-red-700 ring-1 ring-red-600 ring-offset-2';

                  return (
                    <div key={oIndex} className={`p-4 rounded-sm border flex items-center justify-between text-sm transition-all ${style}`}>
                      <span className={isCorrectChoice || isCandidateChoice ? 'font-bold' : 'font-light'}>{opt}</span>
                      {isCandidateChoice && (
                        <span className="text-[9px] uppercase font-black tracking-widest opacity-60 ml-4">
                          Selection
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default DetailedResult;
