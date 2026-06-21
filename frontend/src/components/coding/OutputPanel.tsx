import React from 'react';
import type { TestCaseResult } from './ProblemStatement';

interface RunOutputProps {
  customInput: string;
  onCustomInputChange: (val: string) => void;
  isRunning: boolean;
  result: { stdout: string; stderr: string; status: string } | null;
}

/**
 * "Run Output" tab — custom stdin textarea + stdout/stderr display.
 */
export const RunOutput: React.FC<RunOutputProps> = ({ customInput, onCustomInputChange, isRunning, result }) => (
  <div className="flex gap-3 h-full">
    {/* Custom input */}
    <div className="flex flex-col flex-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-[#6c7086] mb-1">
        Custom Input (stdin)
      </label>
      <textarea
        value={customInput}
        onChange={e => onCustomInputChange(e.target.value)}
        placeholder="Enter input here..."
        className="flex-1 bg-[#1e1e2e] border border-[#313244] rounded text-xs font-mono text-[#cdd6f4] p-2 resize-none focus:outline-none focus:border-[#cba6f7] placeholder:text-[#45475a]"
      />
    </div>

    {/* Output display */}
    <div className="flex flex-col flex-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-[#6c7086] mb-1">Output</label>
      <div className="flex-1 bg-[#1e1e2e] border border-[#313244] rounded p-2 overflow-auto">
        {isRunning ? (
          <div className="flex items-center gap-2 text-[#6c7086] text-xs">
            <span className="w-3 h-3 border border-[#6c7086] border-t-[#cba6f7] rounded-full animate-spin" />
            Executing...
          </div>
        ) : result ? (
          <div className="space-y-2">
            <div className={`text-[10px] font-bold uppercase ${result.stderr ? 'text-red-400' : 'text-[#a6e3a1]'}`}>
              {result.status}
            </div>
            {result.stdout && <pre className="text-xs font-mono text-[#cdd6f4] whitespace-pre-wrap">{result.stdout}</pre>}
            {result.stderr && <pre className="text-xs font-mono text-red-400 whitespace-pre-wrap">{result.stderr}</pre>}
          </div>
        ) : (
          <p className="text-[#45475a] text-xs italic">Click Run to execute your code</p>
        )}
      </div>
    </div>
  </div>
);

interface SubmitResultProps {
  isSubmitting: boolean;
  result: {
    passed: number; total: number; score: number;
    maxScore: number; verdict: string; results: TestCaseResult[];
  } | null;
}

/**
 * "Submit Result" tab — verdict banner + test case grid.
 */
export const SubmitResult: React.FC<SubmitResultProps> = ({ isSubmitting, result }) => {
  if (isSubmitting) return (
    <div className="flex items-center gap-2 text-[#6c7086] text-xs">
      <span className="w-3 h-3 border border-[#6c7086] border-t-[#cba6f7] rounded-full animate-spin" />
      Running against test cases...
    </div>
  );

  if (!result) return (
    <p className="text-[#45475a] text-xs italic">Click Submit to run against all test cases</p>
  );

  const allPassed = result.passed === result.total;

  return (
    <div className="space-y-3">
      {/* Verdict banner */}
      <div className={`flex items-center gap-3 p-2 rounded border ${
        allPassed ? 'border-[#a6e3a1]/30 bg-[#a6e3a1]/5' : 'border-red-800/30 bg-red-950/10'
      }`}>
        <span className="text-lg">{allPassed ? '✅' : '❌'}</span>
        <div>
          <p className={`text-sm font-bold ${allPassed ? 'text-[#a6e3a1]' : 'text-red-400'}`}>
            {result.verdict}
          </p>
          <p className="text-[10px] text-[#6c7086]">
            Score: {result.score} / {result.maxScore} pts
          </p>
        </div>
      </div>

      {/* Detailed Per-case view */}
      <div className="space-y-3 mt-4">
        {result.results.map((r, i) => (
          <div key={i} className={`border rounded p-3 ${r.passed ? 'border-[#a6e3a1]/20 bg-[#1e1e2e]' : 'border-red-800/40 bg-[#f38ba8]/5'}`}>
            <div className="flex items-center gap-2 mb-2 border-b border-[#313244] pb-2">
              <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${r.passed ? 'bg-[#a6e3a1]/10 text-[#a6e3a1]' : 'bg-red-950/40 text-red-400'}`}>
                {i + 1}
              </span>
              <span className={`text-xs font-bold uppercase tracking-widest ${r.passed ? 'text-[#a6e3a1]' : 'text-red-400'}`}>
                {r.passed ? 'Passed' : 'Failed'}
              </span>
              {r.isHidden && (
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-[#313244] text-[#a6adc8] font-bold uppercase tracking-widest">
                  Hidden
                </span>
              )}
            </div>

            {!r.isHidden && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#6c7086] font-bold">Input:</span>
                  <pre className="mt-1 bg-[#181825] border border-[#313244] p-2 rounded text-[#a6adc8] font-mono whitespace-pre-wrap">{r.input}</pre>
                </div>
                <div>
                  <span className="text-[#6c7086] font-bold">Expected Output:</span>
                  <pre className="mt-1 bg-[#181825] border border-[#313244] p-2 rounded text-[#a6e3a1] font-mono whitespace-pre-wrap">{r.expectedOutput}</pre>
                </div>
                <div className="md:col-span-2">
                  <span className="text-[#6c7086] font-bold">Actual Output:</span>
                  <pre className={`mt-1 bg-[#181825] border p-2 rounded font-mono whitespace-pre-wrap ${r.passed ? 'border-[#313244] text-[#a6e3a1]' : 'border-red-900/50 text-red-400'}`}>
                    {r.actualOutput || (r.stderr ? 'Runtime Error / Compilation Error' : '(Empty)')}
                  </pre>
                  {!r.passed && r.stderr && (
                    <div className="mt-2 text-red-400 font-mono text-[10px] bg-red-950/20 p-2 border border-red-900/30 rounded whitespace-pre-wrap">
                      {r.stderr}
                    </div>
                  )}
                </div>
              </div>
            )}
            {r.isHidden && !r.passed && (
               <div className="text-[#a6adc8] text-xs italic mt-2">
                 Details of hidden test cases are not shown. 
                 {r.stderr && " A runtime error occurred."}
               </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface OutputPanelProps {
  activeTab: 'output' | 'submit';
  onTabChange: (tab: 'output' | 'submit') => void;
  // Run tab
  customInput: string;
  onCustomInputChange: (val: string) => void;
  isRunning: boolean;
  runResult: { stdout: string; stderr: string; status: string } | null;
  // Submit tab
  isSubmitting: boolean;
  submitResult: {
    passed: number; total: number; score: number;
    maxScore: number; verdict: string; results: TestCaseResult[];
  } | null;
}

/**
 * Bottom panel container — tab bar + content area.
 * Composes RunOutput and SubmitResult.
 */
const OutputPanel: React.FC<OutputPanelProps> = ({
  activeTab, onTabChange,
  customInput, onCustomInputChange, isRunning, runResult,
  isSubmitting, submitResult,
}) => (
  <div className="h-56 shrink-0 border-t border-[#313244] flex flex-col bg-[#181825]">
    {/* Tabs */}
    <div className="flex border-b border-[#313244] shrink-0">
      {(['output', 'submit'] as const).map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border-r border-[#313244] last:border-r-0 transition-colors ${
            activeTab === tab ? 'text-[#cba6f7] bg-[#1e1e2e]' : 'text-[#6c7086] hover:text-[#cdd6f4]'
          }`}
        >
          {tab === 'output' ? 'Run Output' : 'Submit Result'}
        </button>
      ))}
    </div>

    <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
      {activeTab === 'output' && (
        <RunOutput
          customInput={customInput}
          onCustomInputChange={onCustomInputChange}
          isRunning={isRunning}
          result={runResult}
        />
      )}
      {activeTab === 'submit' && (
        <SubmitResult isSubmitting={isSubmitting} result={submitResult} />
      )}
    </div>
  </div>
);

export default OutputPanel;
