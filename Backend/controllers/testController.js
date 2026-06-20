const Test = require('../models/test');
const Submission = require('../models/submission');
const { calculateScore } = require('../services/testLifecycleService');

exports.getAvailableTests = async (req, res) => {
  try {
    const tests = await Test.find(
      { status: { $in: ['scheduled', 'waiting'] } },
      'title description durationInMinutes status createdAt startedAt completedAt'
    );
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    res.json(test);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.startSubmission = async (req, res) => {
  try {
    const { candidateEmail, candidateName, testId } = req.body;
    const test = await Test.findById(testId);

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    if (test.status !== 'active') {
      return res.status(403).json({ message: 'Test is not active' });
    }

    let submission = await Submission.findOne({ candidateEmail, testId });

    if (submission) {
      if (submission.status === 'completed') {
        return res.status(403).json({ message: 'Test already submitted' });
      }
      return res.json(submission);
    }

    submission = new Submission({ candidateEmail, candidateName, testId });
    await submission.save();
    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.saveAnswer = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { questionId, answerIndex } = req.body;

    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    if (submission.status === 'completed') return res.status(403).json({ message: 'Test already completed' });

    submission.answers.set(questionId, answerIndex);
    await submission.save();

    res.json({ message: 'Answer saved successfully', submission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.clearAnswer = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { questionId } = req.body;

    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    if (submission.status === 'completed') return res.status(403).json({ message: 'Test already completed' });

    submission.answers.delete(questionId);
    await submission.save();

    res.json({ message: 'Answer cleared successfully', submission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.completeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findById(submissionId).populate('testId');
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    if (submission.status === 'completed') return res.status(403).json({ message: 'Already submitted' });

    submission.score = calculateScore(submission, submission.testId);
    submission.status = 'completed';
    await submission.save();

    res.json({ message: 'Test submitted and graded successfully', score: submission.score, submission });
  } catch (error) {
    console.error('Complete Submission Error:', error);
    res.status(500).json({ message: error.message });
  }
};
