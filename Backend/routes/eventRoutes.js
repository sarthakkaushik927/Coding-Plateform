const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

router.get('/test/:testId', eventController.getEvents);

module.exports = router;
