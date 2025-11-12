const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const apiKeyAuth = require('../middleware/apiKeyAuth');
const { validateRequest, schemas } = require('../middleware/validator');
const { analyticsLimiter } = require('../middleware/rateLimiter');

router.post('/collect', apiKeyAuth, analyticsLimiter, validateRequest(schemas.collectEvent), analyticsController.collectEvent);
router.get('/event-summary', apiKeyAuth, analyticsController.getEventSummary);
router.get('/user-stats', apiKeyAuth, analyticsController.getUserStats);

module.exports = router;
