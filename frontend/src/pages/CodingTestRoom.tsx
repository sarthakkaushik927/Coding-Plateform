import React, { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import useProtecting from '../hooks/useProtecting';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import type { RootState } from '../store';
import { startTest } from '../store/testSlice';
import testService, { createEventSourceUrl } from '../utils/apiService';
import ProblemStatement, { type CodingQuestion, type TestCaseResult } from '../components/coding/ProblemStatement';
import OutputPanel from '../components/coding/OutputPanel';
import TestRoomHeader from '../components/test/TestRoomHeader';

export const LANG_META: Record<string, { label: string; monacoLang: string; defaultCode: string }> = {
  javascript: { label: 'JavaScript', monacoLang: 'javascript', defaultCode: '// DO NOT EDIT THE INPUT READING CODE\nconst input = require("fs").readFileSync("/dev/stdin","utf8").trim();\n\n// --- WRITE YOUR LOGIC BELOW ---\n// You can print your output using console.log()\n\nconsole.log(input);\n' },
  python:     { label: 'Python 3',   monacoLang: 'python',     defaultCode: 'import sys\n# DO NOT EDIT THE INPUT READING CODE\ndata = sys.stdin.read().strip()\n\n# --- WRITE YOUR LOGIC BELOW ---\n# You can print your output using print()\n\nprint(data)\n' },
  cpp:        { label: 'C++',        monacoLang: 'cpp',        defaultCode: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // --- WRITE YOUR LOGIC BELOW ---\n    // Read from standard input (e.g., cin >> var)\n    // Print to standard output (e.g., cout << var)\n    \n    return 0;\n}\n' },
  java:       { label: 'Java',       monacoLang: 'java',       defaultCode: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        \n        // --- WRITE YOUR LOGIC BELOW ---\n        // Read from scanner (e.g., scanner.nextLine())\n        // Print to standard output (e.g., System.out.println())\n        \n    }\n}\n' },
  c:          { label: 'C',          monacoLang: 'c',          defaultCode: '#include <stdio.h>\n\nint main() {\n    // --- WRITE YOUR LOGIC BELOW ---\n    // Read from standard input (e.g., scanf)\n    // Print to standard output (e.g., printf)\n    \n    return 0;\n}\n' },
  csharp:     { label: 'C#',         monacoLang: 'csharp',     defaultCode: 'using System;\n\nclass Program {\n    static void Main() {\n        // --- WRITE YOUR LOGIC BELOW ---\n        // Read from standard input (e.g., Console.ReadLine())\n        // Print to standard output (e.g., Console.WriteLine())\n        \n    }\n}\n' },
  go:         { label: 'Go',         monacoLang: 'go',         defaultCode: 'package main\nimport "fmt"\n\nfunc main() {\n    // --- WRITE YOUR LOGIC BELOW ---\n    // Read from standard input (e.g., fmt.Scan())\n    // Print to standard output (e.g., fmt.Println())\n    \n}\n' },
  rust:       { label: 'Rust',       monacoLang: 'rust',       defaultCode: 'use std::io::{self, Read};\n\nfn main() {\n    // DO NOT EDIT THE INPUT READING CODE\n    let mut input = String::new();\n    io::stdin().read_to_string(&mut input).unwrap();\n    let data = input.trim();\n    \n    // --- WRITE YOUR LOGIC BELOW ---\n    // You can print your output using println!()\n    \n}\n' },
  ruby:       { label: 'Ruby',       monacoLang: 'ruby',       defaultCode: '# DO NOT EDIT THE INPUT READING CODE\ninput_data = STDIN.read.strip\n\n# --- WRITE YOUR LOGIC BELOW ---\n# You can print your output using puts\n\nputs input_data\n' },
};

interface TestData {
  _id: string; title: string; status: string;
  durationInMinutes: number; startedAt: string;
  testType?: 'mcq' | 'coding' | 'mixed';
  codingQuestions: CodingQuestion[];
}

function useCountdown(durationMin: number, startedAt: string | null, onExpire: () => void) {
  const [remaining, setRemaining] = useState(durationMin * 60);
  const fired = useRef(false);

  useEffect(() => {
    const tick = () => {
      const start = startedAt ? new Date(startedAt).getTime() : Date.now();
      const left = Math.max(0, Math.floor((start + durationMin * 60_000 - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0 && !fired.current) { fired.current = true; onExpire(); }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [durationMin, startedAt, onExpire]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  return { display: `${mm}:${ss}`, isWarning: remaining < 300 };
}

const CodingTestRoom: React.FC = () => {
  const { id: testId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const existingSubmissionId = useSelector((state: RootState) => state.test.submissionId);

  const [testData, setTestData]         = useState<TestData | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(existingSubmissionId || null);
  const [loading, setLoading]           = useState(true);
  const [finished, setFinished]         = useState(false);
  const [activeQIndex, setActiveQIndex] = useState(0);
  const [language, setLanguage]         = useState('javascript');
  const [initialViolations, setInitialViolations] = useState(0);

  const [code, setCode]             = useState<Record<string, string>>({});
  const [submitted, setSubmitted]   = useState<Record<string, boolean>>({});

  const [activeTab, setActiveTab]         = useState<'output' | 'submit'>('output');
  const [customInput, setCustomInput]     = useState('');
  const [isRunning, setIsRunning]         = useState(false);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [runResult, setRunResult]         = useState<{ stdout: string; stderr: string; status: string } | null>(null);
  const [submitResult, setSubmitResult]   = useState<{ passed: number; total: number; score: number; maxScore: number; verdict: string; results: TestCaseResult[] } | null>(null);

  const activeQuestion = testData?.codingQuestions[activeQIndex] ?? null;
  const codeKey = activeQuestion ? `${activeQuestion._id}_${language}` : '';
  const currentCode = code[codeKey] ?? (activeQuestion?.starterCode?.[language] ?? LANG_META[language]?.defaultCode ?? '');
  const allowedLangs = activeQuestion?.allowedLanguages.filter(l => LANG_META[l]) ?? [];

  useEffect(() => {
    if (!testId) return;
    const init = async () => {
      try {
        const res = await testService.getTest(testId);
        const t = res.data as TestData;
        if (t.status !== 'active' || !t.codingQuestions?.length) { navigate('/dashboard'); return; }
        setTestData(t);

        const email = user?.email || 'candidate@example.com';
        const name = user?.name || 'Candidate';
        const submissionRes = await testService.startSubmission(email, name, testId);
        const fetchedSubmission = submissionRes.data;
        
        setInitialViolations(fetchedSubmission.violations?.length || 0);
        setSubmissionId(fetchedSubmission._id);

        if (!existingSubmissionId) {
          dispatch(startTest({
            submissionId: fetchedSubmission._id,
            testId,
            duration: t.durationInMinutes,
            startedAt: t.startedAt
          }));
        }
        
        setLoading(false);
      } catch {
        navigate('/dashboard');
      }
    };
    init();
  }, [testId, navigate, dispatch, existingSubmissionId, user?.email, user?.name]);

  useEffect(() => {
    if (!testId) return;
    const es = new EventSource(createEventSourceUrl(`/events/test/${testId}`));
    es.onmessage = e => {
      if (JSON.parse(e.data).type === 'AUTO_SUBMIT') setFinished(true);
    };
    return () => es.close();
  }, [testId]);

  const MAX_VIOLATIONS = 3;

  const handleViolation = useCallback((count: number, type: string) => {
    const labels: Record<string, string> = {
      tab_switch: 'Tab switch detected',
      window_blur: 'Window switch detected',
      fullscreen_exit: 'Fullscreen exit detected',
    };
    const remaining = MAX_VIOLATIONS - count;

    if (remaining > 0) {
      toast.error(`⚠️ ${labels[type] || 'Violation detected'} — ${remaining} warning${remaining !== 1 ? 's' : ''} left before auto-submit`, {
        duration: 5000,
        id: 'violation-toast',
      });
    } else {
      toast.error('🚫 Max violations reached — auto-submitting your test', {
        duration: 6000,
        id: 'violation-toast',
      });
    }
  }, []);

  const handleAutoSubmit = useCallback(() => {
    if (submissionId) {
      testService.completeSubmission(submissionId)
        .then(() => setFinished(true))
        .catch(err => console.error('Auto-submit failed:', err));
    }
  }, [submissionId]);

  useProtecting({
    onViolation: handleViolation,
    onAutoSubmit: handleAutoSubmit,
    submissionId,
    maxViolations: MAX_VIOLATIONS,
    cooldownMs: 1500,
    enabled: !!testData && !finished,
    initialViolations,
  });

  const { display: timerDisplay, isWarning } = useCountdown(
    testData?.durationInMinutes ?? 60,
    testData?.startedAt ?? null,
    () => setFinished(true)
  );

  const handleQuestionChange = (idx: number) => {
    setActiveQIndex(idx);
    setRunResult(null);
    setSubmitResult(null);
    setActiveTab('output');
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setRunResult(null);
    setSubmitResult(null);
  };

  const handleRun = async () => {
    if (!currentCode.trim()) return;
    setIsRunning(true);
    setActiveTab('output');
    setRunResult(null);
    try {
      const res = await testService.runCode(currentCode, language, customInput);
      setRunResult(res.data);
    } catch {
      setRunResult({ stdout: '', stderr: 'Failed to connect to execution service.', status: 'Error' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!testId || !activeQuestion || !submissionId) return;
    setIsSubmitting(true);
    setActiveTab('submit');
    setSubmitResult(null);
    try {
      const res = await testService.submitCode(testId, activeQuestion._id, currentCode, language, submissionId);
      setSubmitResult(res.data);
      if (res.data.passed === res.data.total) {
        setSubmitted(prev => ({ ...prev, [activeQuestion._id]: true }));
      }
    } catch {
      setSubmitResult({ passed: 0, total: 0, score: 0, maxScore: 0, verdict: 'Submission failed', results: [] });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishTest = async () => {
    if (!submissionId) return;
    setIsSubmitting(true);
    try {
      await testService.completeSubmission(submissionId);
      setFinished(true);
    } catch (err) {
      console.error('Failed to finish test', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 border-2 border-cream-200 border-t-cream-900 rounded-full animate-spin" />
      <p className="mt-6 text-sm text-cream-400 uppercase tracking-widest font-bold">Establishing Secure Session...</p>
    </div>
  );

  if (finished) return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 border-2 border-cream-950 flex items-center justify-center text-cream-950 font-serif font-bold text-3xl mb-8">
        N
      </div>
      <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400 mb-2">Protocol Finished</div>
      <h2 className="text-4xl font-serif text-cream-950 mb-4">Submission Confirmed</h2>
      <p className="text-cream-600 mb-12 max-w-md font-light italic">Your code has been securely persisted. You may now exit the assessment environment.</p>
      <button onClick={() => navigate('/')} className="btn-primary">Return to Home</button>
    </div>
  );

  if (!testData || !activeQuestion) return null;

  return (
    <div className="h-screen flex flex-col bg-cream-50 text-cream-900 font-sans overflow-hidden">
      <TestRoomHeader candidateName={user?.name} />

      {/* Sub-header: test title, timer, question pills, finish */}
      <div className="bg-white border-b border-cream-200 px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0 flex-wrap">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400">Coding Assessment</div>
          <h1 className="text-sm sm:text-base font-serif text-cream-950 truncate">{testData.title}</h1>
        </div>

        <div className="flex-1" />

        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono font-bold border ${
          isWarning ? 'text-red-800 border-red-200 bg-red-50 animate-pulse' : 'text-cream-950 border-cream-200 bg-cream-50'
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-cream-400 font-sans">Time</span>
          {timerDisplay}
        </div>

        <div className="flex gap-1 flex-wrap">
          {testData.codingQuestions.map((q, i) => (
            <button
              key={q._id}
              onClick={() => handleQuestionChange(i)}
              className={`w-8 h-8 text-xs font-bold rounded-sm border transition-all ${
                i === activeQIndex
                  ? 'bg-cream-900 text-cream-50 border-cream-900'
                  : submitted[q._id]
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-white text-cream-500 border-cream-200 hover:border-cream-400 hover:text-cream-900'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {testData.testType === 'mixed' && (
          <button
            onClick={() => navigate(`/test/${testId}`)}
            className="px-4 py-2 bg-white text-cream-900 text-[10px] font-black uppercase tracking-widest rounded-sm border border-cream-200 transition-all hover:bg-cream-50"
          >
            Back to MCQ
          </button>
        )}

        <button
          onClick={handleFinishTest}
          disabled={isSubmitting}
          className="px-4 py-2 bg-emerald-800 text-white text-[10px] font-black uppercase tracking-widest rounded-sm border border-emerald-900 transition-all hover:bg-emerald-900 disabled:opacity-50"
        >
          Finish Test
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="w-full lg:w-[420px] shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-cream-200 overflow-y-auto custom-scrollbar bg-white max-h-[35vh] lg:max-h-full">
          <ProblemStatement
            question={activeQuestion}
            questionIndex={activeQIndex}
            totalQuestions={testData.codingQuestions.length}
          />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="h-11 bg-cream-50 border-b border-cream-200 flex items-center px-3 gap-3 shrink-0">
            <label className="text-[10px] font-bold uppercase tracking-widest text-cream-400 hidden sm:block">Language</label>
            <select
              value={language}
              onChange={e => handleLanguageChange(e.target.value)}
              className="bg-white border border-cream-200 text-cream-900 text-xs px-3 py-1.5 rounded-sm focus:outline-none focus:border-cream-400 font-bold uppercase tracking-wider"
            >
              {allowedLangs.map(l => (
                <option key={l} value={l}>{LANG_META[l]?.label ?? l}</option>
              ))}
            </select>

            <div className="flex-1" />

            <button
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-cream-50 border border-cream-200 text-cream-900 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all disabled:opacity-40"
            >
              {isRunning
                ? <span className="w-3 h-3 border border-cream-300 border-t-cream-900 rounded-full animate-spin" />
                : null
              }
              Run
            </button>

            <button
              onClick={handleSubmit}
              disabled={isRunning || isSubmitting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cream-900 hover:bg-cream-950 text-cream-50 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all disabled:opacity-40"
            >
              {isSubmitting
                ? <span className="w-3 h-3 border border-cream-200 border-t-transparent rounded-full animate-spin" />
                : null
              }
              Submit
            </button>
          </div>

          <div className="flex-1 overflow-hidden border-b border-cream-200">
            <Editor
              height="100%"
              language={LANG_META[language]?.monacoLang ?? language}
              value={currentCode}
              onChange={val => setCode(prev => ({ ...prev, [codeKey]: val ?? '' }))}
              theme="vs-light"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                tabSize: 2,
                wordWrap: 'on',
                fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", Consolas, monospace',
                fontLigatures: true,
                padding: { top: 12 },
                automaticLayout: true,
              }}
            />
          </div>

          <OutputPanel
            activeTab={activeTab}
            onTabChange={setActiveTab}
            customInput={customInput}
            onCustomInputChange={setCustomInput}
            isRunning={isRunning}
            runResult={runResult}
            isSubmitting={isSubmitting}
            submitResult={submitResult}
          />
        </div>
      </div>
    </div>
  );
};

export default CodingTestRoom;
