const apiKeyService = require('../services/apiKey.service');
const logger = require('../services/logger');

async function register(req, res) {
  try {
    const { name, ownerEmail } = req.body;

    const existingApp = await apiKeyService.getAppByEmail(ownerEmail);
    if (existingApp) {
      return res.status(409).json({
        success: false,
        error: 'An app is already registered with this email',
      });
    }

    const { app, apiKey } = await apiKeyService.createApp(name, ownerEmail);

    logger.info(`New app registered: ${app.id}`);

    res.status(201).json({
      success: true,
      data: {
        appId: app.id,
        name: app.name,
        ownerEmail: app.owner_email,
        apiKey,
        expiresAt: app.expires_at,
        createdAt: app.created_at,
      },
      message: 'App registered successfully. Store your API key securely.',
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register app',
    });
  }
}

async function getApiKey(req, res) {
  try {
    const { email } = req.body;

    const app = await apiKeyService.getAppByEmail(email);

    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'No app found with this email',
      });
    }

    res.json({
      success: true,
      data: {
        appId: app.id,
        name: app.name,
        ownerEmail: app.owner_email,
        revoked: app.revoked,
        expiresAt: app.expires_at,
        createdAt: app.created_at,
      },
      message: 'API key cannot be retrieved for security. Use regenerate if needed.',
    });
  } catch (error) {
    logger.error('Get API key error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve API key info',
    });
  }
}

async function revokeApiKey(req, res) {
  try {
    const { appId } = req.body;

    const app = await apiKeyService.revokeApiKey(appId);

    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'App not found',
      });
    }

    logger.info(`API key revoked for app: ${appId}`);

    res.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (error) {
    logger.error('Revoke API key error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key',
    });
  }
}

async function regenerateApiKey(req, res) {
  try {
    const { appId } = req.body;

    const { app, apiKey } = await apiKeyService.regenerateApiKey(appId);

    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'App not found',
      });
    }

    logger.info(`API key regenerated for app: ${appId}`);

    res.json({
      success: true,
      data: {
        appId: app.id,
        name: app.name,
        apiKey,
      },
      message: 'API key regenerated successfully. Store it securely.',
    });
  } catch (error) {
    logger.error('Regenerate API key error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate API key',
    });
  }
}

module.exports = {
  register,
  getApiKey,
  revokeApiKey,
  regenerateApiKey,
};
