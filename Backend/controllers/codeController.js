const { executeCode, runAgainstTestCases } = require('../services/judge0Service');
const Test = require('../models/test');

/**
 * POST /api/code/run
 * Quick "Run Code" against custom user-provided input (not hidden test cases).
 * Used for the "Run" button in the editor (not scored).
 */
exports.runCode = async (req, res) => {
  try {
    const { sourceCode, language, stdin = '' } = req.body;

    if (!sourceCode || !language) {
      return res.status(400).json({ message: 'sourceCode and language are required.' });
    }

    const result = await executeCode({ sourceCode, language, stdin });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/code/submit/:testId/:questionId
 * Official submission — runs against ALL hidden test cases and calculates score.
 * Saves result so admin can see it later.
 */
exports.submitCode = async (req, res) => {
  try {
    const { testId, questionId } = req.params;
    const { sourceCode, language, submissionId } = req.body;

    if (!sourceCode || !language || !submissionId) {
      return res.status(400).json({ message: 'sourceCode, language, and submissionId are required.' });
    }

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: 'Test not found.' });
    if (test.status !== 'active') return res.status(403).json({ message: 'Test is not active.' });

    const question = test.codingQuestions.id(questionId);
    if (!question) return res.status(404).json({ message: 'Coding question not found.' });

    const Submission = require('../models/submission');
    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: 'Submission not found.' });

    const { results, passed, total } = await runAgainstTestCases({
      sourceCode,
      language,
      testCases: question.testCases,
    });

    const score = total > 0 ? Math.round((passed / total) * question.points) : 0;
    const verdict = passed === total ? 'Accepted' : `${passed}/${total} Test Cases Passed`;

    // Save to submission
    submission.codingAnswers.set(questionId, {
      sourceCode,
      language,
      score,
      verdict,
      passed,
      total
    });
    await submission.save();

    res.json({
      passed,
      total,
      score,
      maxScore: question.points,
      results,
      verdict,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
