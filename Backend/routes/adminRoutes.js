const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.use(requireAuth);
router.use(requireAdmin);

router.post('/test', adminController.createTest);
router.post('/test/:id/open-waiting-room', adminController.openWaitingRoom);
router.post('/test/:id/start', adminController.startTest);
router.post('/test/:id/complete', adminController.completeTest);
router.post('/test/:id/auto-submit', adminController.autoSubmitTest);

router.get('/tests/history', adminController.getTestHistory);
router.get('/tests/queues', adminController.getWaitingQueues);
router.get('/test/:id/results', adminController.getTestResults);
router.get('/submission/:id', adminController.getSubmissionDetails);

module.exports = router;
