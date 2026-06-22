import React from 'react';

export interface Example { input: string; output: string; explanation?: string; }
export interface CodingQuestion {
  _id: string; title: string; description: string; constraints: string;
  examples: Example[]; allowedLanguages: string[]; starterCode: Record<string, string>;
  points: number; difficulty: 'easy' | 'medium' | 'hard'; order: number;
}
export interface TestCaseResult {
  input: string; expectedOutput: string; actualOutput: string;
  passed: boolean; status: string; time?: string; stderr?: string; isHidden?: boolean;
}

const DIFFICULTY_STYLE = {
  easy: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  medium: 'text-amber-800 bg-amber-50 border-amber-200',
  hard: 'text-red-800 bg-red-50 border-red-200',
};

interface ProblemStatementProps {
  question: CodingQuestion;
  questionIndex: number;
  totalQuestions: number;
}

const ProblemStatement: React.FC<ProblemStatementProps> = ({ question, questionIndex, totalQuestions }) => (
  <div className="p-5 sm:p-6 space-y-5">
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[10px] font-bold text-cream-400 uppercase tracking-widest">
          Q{questionIndex + 1} / {totalQuestions}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border ${DIFFICULTY_STYLE[question.difficulty]}`}>
          {question.difficulty}
        </span>
        <span className="text-[10px] text-cream-500 ml-auto font-bold uppercase tracking-widest">{question.points} pts</span>
      </div>
      <h2 className="text-xl sm:text-2xl font-serif text-cream-950 leading-tight">{question.title}</h2>
    </div>

    <div className="text-sm text-cream-700 leading-relaxed whitespace-pre-wrap border-t border-cream-200 pt-4 font-light">
      {question.description}
    </div>

    {question.examples?.length > 0 && (
      <div className="space-y-3 border-t border-cream-200 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-cream-400">Examples</p>
        {question.examples.map((ex, i) => (
          <div key={i} className="rounded-sm border border-cream-200 overflow-hidden text-xs bg-white">
            <div className="px-3 py-3 space-y-2">
              <div>
                <span className="text-cream-500 font-bold uppercase tracking-wider text-[10px]">Input</span>
                <pre className="mt-1 text-cream-900 font-mono bg-cream-50 border border-cream-100 p-2 rounded-sm">{ex.input}</pre>
              </div>
              <div>
                <span className="text-cream-500 font-bold uppercase tracking-wider text-[10px]">Output</span>
                <pre className="mt-1 text-emerald-800 font-mono bg-emerald-50/50 border border-emerald-100 p-2 rounded-sm">{ex.output}</pre>
              </div>
              {ex.explanation && (
                <div className="text-cream-500 italic pt-1 text-xs">{ex.explanation}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    )}

    {question.constraints && (
      <div className="border-t border-cream-200 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-cream-400 mb-2">Constraints</p>
        <pre className="text-xs text-cream-700 font-mono whitespace-pre-wrap bg-cream-50 border border-cream-100 p-3 rounded-sm">{question.constraints}</pre>
      </div>
    )}
  </div>
);

export default ProblemStatement;
