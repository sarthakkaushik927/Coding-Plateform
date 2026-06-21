const XLSX = require('xlsx');

// ─── MCQ Sheet Parser ─────────────────────────────────────────────────────────

const parseMCQSheet = (sheet) => {
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const errors = [];
  const questions = [];

  rawRows.forEach((row, i) => {
    const rowNum = i + 2;
    const n = {};
    Object.keys(row).forEach(k => { n[k.trim().toLowerCase()] = String(row[k]).trim(); });

    const questionText = n['questiontext'] || n['question_text'] || n['question'] || '';
    const option1 = n['option1'] || n['choice_a'] || n['a'] || '';
    const option2 = n['option2'] || n['choice_b'] || n['b'] || '';
    const option3 = n['option3'] || n['choice_c'] || n['c'] || '';
    const option4 = n['option4'] || n['choice_d'] || n['d'] || '';
    const correctRaw = n['correctoptionindex'] || n['correct'] || n['answer'] || '0';
    const pointsRaw = n['points'] || n['marks'] || '1';

    if (!questionText) { errors.push(`MCQ Row ${rowNum}: Missing question text`); return; }
    if (!option1 || !option2 || !option3 || !option4) {
      errors.push(`MCQ Row ${rowNum}: All four options (option1–option4) required`); return;
    }

    const correctOptionIndex = parseInt(correctRaw, 10);
    if (isNaN(correctOptionIndex) || correctOptionIndex < 0 || correctOptionIndex > 3) {
      errors.push(`MCQ Row ${rowNum}: correctOptionIndex must be 0, 1, 2, or 3`); return;
    }

    const points = parseInt(pointsRaw, 10);
    questions.push({
      questionText,
      options: [option1, option2, option3, option4],
      correctOptionIndex,
      points: isNaN(points) || points < 1 ? 1 : points,
    });
  });

  return { questions, errors };
};

// ─── Coding Sheet Parser ──────────────────────────────────────────────────────

/**
 * Coding sheet column format:
 *   title | description | difficulty | points | constraints |
 *   ex1_input | ex1_output | ex1_explanation |
 *   ex2_input | ex2_output | ex2_explanation |
 *   tc1_input | tc1_expected | tc1_hidden |
 *   tc2_input | tc2_expected | tc2_hidden |
 *   tc3_input | tc3_expected | tc3_hidden
 *
 * Up to 3 examples and 5 test cases per row are supported.
 */
const parseCodingSheet = (sheet) => {
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const errors = [];
  const questions = [];

  rawRows.forEach((row, i) => {
    const rowNum = i + 2;
    const n = {};
    Object.keys(row).forEach(k => { n[k.trim().toLowerCase()] = String(row[k]).trim(); });

    const title = n['title'] || '';
    const description = n['description'] || '';
    const difficulty = n['difficulty'] || 'medium';
    const pointsRaw = n['points'] || '10';
    const constraints = n['constraints'] || '';

    if (!title) { errors.push(`Coding Row ${rowNum}: Missing title`); return; }
    if (!description) { errors.push(`Coding Row ${rowNum}: Missing description`); return; }

    // Parse up to 3 examples
    const examples = [];
    for (let e = 1; e <= 3; e++) {
      const inp = n[`ex${e}_input`] || '';
      const out = n[`ex${e}_output`] || '';
      if (inp || out) {
        examples.push({
          input: inp,
          output: out,
          explanation: n[`ex${e}_explanation`] || '',
        });
      }
    }

    // Parse up to 5 test cases
    const testCases = [];
    for (let t = 1; t <= 5; t++) {
      const inp = n[`tc${t}_input`] || '';
      const expected = n[`tc${t}_expected`] || '';
      if (inp || expected) {
        const hiddenRaw = n[`tc${t}_hidden`] || '';
        const isHidden = hiddenRaw.toLowerCase() === 'true' || hiddenRaw === '1';
        testCases.push({ input: inp, expectedOutput: expected, isHidden });
      }
    }

    if (testCases.length === 0) {
      errors.push(`Coding Row ${rowNum}: At least one test case (tc1_input + tc1_expected) required`);
      return;
    }

    const points = parseInt(pointsRaw, 10);
    const allowedDifficulties = ['easy', 'medium', 'hard'];

    questions.push({
      title,
      description,
      constraints,
      difficulty: allowedDifficulties.includes(difficulty.toLowerCase()) ? difficulty.toLowerCase() : 'medium',
      points: isNaN(points) || points < 1 ? 10 : points,
      examples,
      testCases,
      allowedLanguages: ['javascript', 'python', 'cpp', 'java', 'c', 'csharp', 'go', 'rust', 'ruby'],
      starterCode: {},
    });
  });

  return { questions, errors };
};

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Parses a buffer from an uploaded Excel file.
 *
 * Supports two modes:
 *  1. Single-sheet / CSV  → treated as MCQ-only (backward compatible)
 *  2. Multi-sheet Excel   → looks for "MCQ" and/or "Coding" named sheets
 *
 * Returns: { mcqQuestions, codingQuestions, errors, testType }
 */
const parseQuestionsFromBuffer = (buffer, originalName) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetNames = workbook.SheetNames.map(s => s.toLowerCase());

  const hasMCQSheet    = sheetNames.includes('mcq');
  const hasCodingSheet = sheetNames.includes('coding');
  const isCSV          = originalName.toLowerCase().endsWith('.csv');

  // ── Single-sheet or CSV: fall back to MCQ-only mode ──
  if (isCSV || (!hasMCQSheet && !hasCodingSheet)) {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw new Error('The uploaded file has no sheets.');
    const { questions, errors } = parseMCQSheet(sheet);
    return {
      mcqQuestions: questions,
      codingQuestions: [],
      errors,
      testType: 'mcq',
    };
  }

  // ── Multi-sheet mode ──
  const allErrors = [];
  let mcqQuestions = [];
  let codingQuestions = [];

  if (hasMCQSheet) {
    const sheetKey = workbook.SheetNames.find(s => s.toLowerCase() === 'mcq');
    const { questions, errors } = parseMCQSheet(workbook.Sheets[sheetKey]);
    mcqQuestions = questions;
    allErrors.push(...errors);
  }

  if (hasCodingSheet) {
    const sheetKey = workbook.SheetNames.find(s => s.toLowerCase() === 'coding');
    const { questions, errors } = parseCodingSheet(workbook.Sheets[sheetKey]);
    codingQuestions = questions;
    allErrors.push(...errors);
  }

  let testType = 'mcq';
  if (mcqQuestions.length > 0 && codingQuestions.length > 0) testType = 'mixed';
  else if (codingQuestions.length > 0) testType = 'coding';

  return { mcqQuestions, codingQuestions, errors: allErrors, testType };
};

module.exports = { parseQuestionsFromBuffer };
