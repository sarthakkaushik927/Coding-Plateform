const Test = require('../models/test');
const Submission = require('../models/submission');
const eventController = require('../controllers/eventController');

function getAnswerValue(answers, questionId) {
  if (!answers) return undefined;
  if (answers instanceof Map) {
    return answers.get(questionId);
  }
  if (typeof answers.get === 'function') {
    return answers.get(questionId);
  }
  return answers[questionId];
}

function calculateScore(submission, test) {
  let totalScore = 0;

  test.questions.forEach((question) => {
    const candidateAnswer = getAnswerValue(submission.answers, question._id.toString());
    // Ensure both are numbers for comparison
    if (candidateAnswer !== undefined && Number(candidateAnswer) === Number(question.correctOptionIndex)) {
      totalScore += question.points || 1;
    }
  });

  return totalScore;
}

function isTestExpired(test) {
  if (!test || test.status !== 'active' || !test.startedAt) {
    return false;
  }

  const endTime = new Date(test.startedAt).getTime() + (test.durationInMinutes * 60 * 1000);
  return Date.now() >= endTime;
}

async function completeTestAndAutoSubmit(testId, reason = 'manual') {
  const test = await Test.findById(testId);
  if (!test) {
    return { found: false, alreadyCompleted: false, autoSubmittedCount: 0, test: null };
  }

  const activeSubmissions = await Submission.find({ testId, status: 'active' });

  for (const submission of activeSubmissions) {
    submission.score = calculateScore(submission, test);
    submission.status = 'completed';
    await submission.save();
  }

  const wasAlreadyCompleted = test.status === 'completed';
  if (!wasAlreadyCompleted) {
    test.status = 'completed';
    test.completedAt = new Date();
    await test.save();
  }

  eventController.broadcastEvent(String(testId), {
    type: 'AUTO_SUBMIT',
    testId: String(testId),
    reason,
    completedAt: test.completedAt || new Date().toISOString()
  });

  return {
    found: true,
    alreadyCompleted: wasAlreadyCompleted,
    autoSubmittedCount: activeSubmissions.length,
    test
  };
}

async function completeExpiredTests() {
  const activeTests = await Test.find({ status: 'active', startedAt: { $ne: null } });
  const results = [];

  for (const test of activeTests) {
    if (!isTestExpired(test)) {
      continue;
    }

    const result = await completeTestAndAutoSubmit(test._id, 'duration_expired');
    results.push(result);
  }

  return results;
}

module.exports = {
  calculateScore,
  isTestExpired,
  completeTestAndAutoSubmit,
  completeExpiredTests
};
