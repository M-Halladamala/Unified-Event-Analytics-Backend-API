const { verifyApiKey } = require('../services/apiKey.service');
const logger = require('../services/logger');

async function apiKeyAuth(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key is required in x-api-key header',
      });
    }

    const app = await verifyApiKey(apiKey);

    if (!app) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired API key',
      });
    }

    req.app_id = app.id;
    req.app_name = app.name;
    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

module.exports = apiKeyAuth;
