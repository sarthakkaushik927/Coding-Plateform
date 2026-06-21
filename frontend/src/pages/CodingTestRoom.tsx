import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import type { RootState } from '../store';
import { startTest } from '../store/testSlice';
import testService, { createEventSourceUrl } from '../utils/apiService';
import ProblemStatement, { type CodingQuestion, type TestCaseResult } from '../components/coding/ProblemStatement';
import OutputPanel from '../components/coding/OutputPanel';

// ─── Language config ──────────────────────────────────────────────────────────

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
  codingQuestions: CodingQuestion[];
}

// ─── Timer hook ───────────────────────────────────────────────────────────────

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

// ─── CodingTestRoom ───────────────────────────────────────────────────────────

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

  // code[`${questionId}_${lang}`] -> source code
  const [code, setCode]             = useState<Record<string, string>>({});
  const [submitted, setSubmitted]   = useState<Record<string, boolean>>({});

  // output panel state
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

  // ── Load test ──
  useEffect(() => {
    if (!testId) return;
    const init = async () => {
      try {
        const res = await testService.getTest(testId);
        const t = res.data as TestData;
        if (t.status !== 'active' || !t.codingQuestions?.length) { navigate('/dashboard'); return; }
        setTestData(t);

        // Initialize submission if we don't have one from Redux
        let currentSubmissionId = existingSubmissionId;
        if (!currentSubmissionId) {
          const email = user?.email || 'candidate@example.com';
          const name = user?.name || 'Candidate';
          const submissionRes = await testService.startSubmission(email, name, testId);
          currentSubmissionId = submissionRes.data._id;
          dispatch(startTest({
            submissionId: currentSubmissionId as string,
            testId,
            duration: t.durationInMinutes,
            startedAt: t.startedAt
          }));
        }
        setSubmissionId(currentSubmissionId || null);
        setLoading(false);
      } catch (err) {
        navigate('/dashboard');
      }
    };
    init();
  }, [testId, navigate, dispatch, existingSubmissionId, user?.email, user?.name]);

  // ── SSE force-complete ──
  useEffect(() => {
    if (!testId) return;
    const es = new EventSource(createEventSourceUrl(`/events/test/${testId}`));
    es.onmessage = e => {
      if (JSON.parse(e.data).type === 'AUTO_SUBMIT') setFinished(true);
    };
    return () => es.close();
  }, [testId]);

  const { display: timerDisplay, isWarning } = useCountdown(
    testData?.durationInMinutes ?? 60,
    testData?.startedAt ?? null,
    () => setFinished(true)
  );

  // ── Handlers ──

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

  // ── Loading / Finished screens ──

  if (loading) return (
    <div className="h-screen bg-[#1e1e2e] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#313244] border-t-[#cba6f7] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#6c7086] text-xs uppercase tracking-widest">Loading Assessment...</p>
      </div>
    </div>
  );

  if (finished) return (
    <div className="h-screen bg-[#1e1e2e] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-5xl">✅</div>
        <h2 className="text-2xl font-bold text-[#cdd6f4]">Session Complete</h2>
        <p className="text-[#6c7086] text-sm">Your code has been recorded.</p>
        <button onClick={() => navigate('/')} className="mt-6 px-6 py-2.5 bg-[#cba6f7] text-[#1e1e2e] rounded text-sm font-bold hover:bg-[#b4a0e0] transition-colors">
          Return Home
        </button>
      </div>
    </div>
  );

  if (!testData || !activeQuestion) return null;

  return (
    <div className="h-screen flex flex-col bg-[#1e1e2e] text-[#cdd6f4] font-sans overflow-hidden">

      {/* ── Top Bar ── */}
      <header className="h-12 bg-[#181825] border-b border-[#313244] flex items-center px-4 gap-4 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border border-[#cba6f7] flex items-center justify-center text-[#cba6f7] font-bold text-xs">N</div>
          <span className="text-xs font-bold text-[#cdd6f4] tracking-wide hidden sm:block">{testData.title}</span>
        </div>

        <div className="flex-1" />

        {/* Timer */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold border ${
          isWarning ? 'text-red-400 border-red-800 bg-red-950/30 animate-pulse' : 'text-[#a6e3a1] border-[#313244]'
        }`}>
          ⏱ {timerDisplay}
        </div>

        {/* Question tab pills */}
        <div className="flex gap-1">
          {testData.codingQuestions.map((q, i) => (
            <button
              key={q._id}
              onClick={() => handleQuestionChange(i)}
              className={`w-7 h-7 text-xs font-bold rounded border transition-all ${
                i === activeQIndex         ? 'bg-[#cba6f7] text-[#1e1e2e] border-[#cba6f7]'
                : submitted[q._id]        ? 'bg-[#a6e3a1]/10 text-[#a6e3a1] border-[#a6e3a1]/40'
                                          : 'bg-transparent text-[#6c7086] border-[#313244] hover:border-[#cba6f7] hover:text-[#cba6f7]'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-[#313244]" />
        
        <button
          onClick={handleFinishTest}
          disabled={isSubmitting}
          className="ml-auto px-3 py-1 bg-red-900/40 hover:bg-red-900/60 text-red-200 border border-red-900 text-xs font-bold rounded transition-all hidden sm:block"
        >
          Finish Test
        </button>

        <div className="w-px h-6 bg-[#313244]" />
        <span className="text-[10px] text-[#6c7086] uppercase tracking-widest hidden sm:block">{user?.name}</span>
      </header>

      {/* ── Split layout ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* LEFT — Problem statement */}
        <div className="w-full lg:w-[420px] shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-[#313244] overflow-y-auto custom-scrollbar bg-[#181825] max-h-[35vh] lg:max-h-full">
          <ProblemStatement
            question={activeQuestion}
            questionIndex={activeQIndex}
            totalQuestions={testData.codingQuestions.length}
          />
        </div>

        {/* RIGHT — Editor + Output */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Editor toolbar */}
          <div className="h-10 bg-[#181825] border-b border-[#313244] flex items-center px-3 gap-3 shrink-0">
            <select
              value={language}
              onChange={e => handleLanguageChange(e.target.value)}
              className="bg-[#313244] border border-[#45475a] text-[#cdd6f4] text-xs px-2 py-1 rounded focus:outline-none focus:border-[#cba6f7]"
            >
              {allowedLangs.map(l => (
                <option key={l} value={l}>{LANG_META[l]?.label ?? l}</option>
              ))}
            </select>

            <div className="flex-1" />

            <button
              onClick={handleFinishTest}
              disabled={isSubmitting}
              className="px-3 py-1 bg-red-900/40 hover:bg-red-900/60 text-red-200 border border-red-900 text-xs font-bold rounded transition-all sm:hidden mr-auto"
            >
              Finish
            </button>

            <button
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#313244] hover:bg-[#45475a] border border-[#45475a] text-[#cdd6f4] text-xs font-bold rounded transition-all disabled:opacity-40"
            >
              {isRunning
                ? <span className="w-3 h-3 border border-[#cdd6f4] border-t-transparent rounded-full animate-spin" />
                : '▶'
              }
              Run
            </button>

            <button
              onClick={handleSubmit}
              disabled={isRunning || isSubmitting}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#a6e3a1] hover:bg-[#94d4a4] text-[#1e1e2e] text-xs font-bold rounded transition-all disabled:opacity-40"
            >
              {isSubmitting
                ? <span className="w-3 h-3 border border-[#1e1e2e] border-t-transparent rounded-full animate-spin" />
                : '⚡'
              }
              Submit
            </button>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={LANG_META[language]?.monacoLang ?? language}
              value={currentCode}
              onChange={val => setCode(prev => ({ ...prev, [codeKey]: val ?? '' }))}
              theme="vs-dark"
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

          {/* Output Panel */}
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
