const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateRequest, schemas } = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, validateRequest(schemas.register), authController.register);
router.post('/api-key', authLimiter, validateRequest(schemas.getApiKey), authController.getApiKey);
router.post('/revoke', authLimiter, validateRequest(schemas.revokeKey), authController.revokeApiKey);
router.post('/regenerate', authLimiter, validateRequest(schemas.regenerateKey), authController.regenerateApiKey);

module.exports = router;
