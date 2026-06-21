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

const DIFFICULTY_COLOR = { easy: 'text-green-600', medium: 'text-amber-600', hard: 'text-red-600' };

interface ProblemStatementProps {
  question: CodingQuestion;
  questionIndex: number;
  totalQuestions: number;
}

/**
 * Left panel in the coding test room — shows problem description,
 * examples, and constraints. Reusable anywhere a question needs to be displayed.
 */
const ProblemStatement: React.FC<ProblemStatementProps> = ({ question, questionIndex, totalQuestions }) => (
  <div className="p-5 space-y-5">
    {/* Title + meta */}
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold text-[#6c7086] uppercase tracking-widest">
          Q{questionIndex + 1} / {totalQuestions}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${DIFFICULTY_COLOR[question.difficulty]}`}>
          {question.difficulty}
        </span>
        <span className="text-[10px] text-[#6c7086] ml-auto">{question.points} pts</span>
      </div>
      <h2 className="text-lg font-bold text-[#cdd6f4]">{question.title}</h2>
    </div>

    {/* Description */}
    <div className="text-sm text-[#a6adc8] leading-relaxed whitespace-pre-wrap border-t border-[#313244] pt-4">
      {question.description}
    </div>

    {/* Examples */}
    {question.examples?.length > 0 && (
      <div className="space-y-3 border-t border-[#313244] pt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#6c7086]">Examples</p>
        {question.examples.map((ex, i) => (
          <div key={i} className="rounded border border-[#313244] overflow-hidden text-xs">
            <div className="bg-[#1e1e2e] px-3 py-2 space-y-1">
              <div>
                <span className="text-[#6c7086] font-bold">Input:</span>
                <pre className="mt-1 text-[#a6e3a1] font-mono">{ex.input}</pre>
              </div>
              <div>
                <span className="text-[#6c7086] font-bold">Output:</span>
                <pre className="mt-1 text-[#cba6f7] font-mono">{ex.output}</pre>
              </div>
              {ex.explanation && (
                <div className="text-[#6c7086] italic pt-1">{ex.explanation}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Constraints */}
    {question.constraints && (
      <div className="border-t border-[#313244] pt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#6c7086] mb-2">Constraints</p>
        <pre className="text-xs text-[#a6adc8] font-mono whitespace-pre-wrap">{question.constraints}</pre>
      </div>
    )}
  </div>
);

export default ProblemStatement;
