const bcrypt = require('bcrypt');
const { generateApiKey } = require('../utils/generateKey');
const pool = require('./db');

const SALT_ROUNDS = 10;

async function createApp(name, ownerEmail) {
  const apiKey = generateApiKey();
  const apiKeyHash = await bcrypt.hash(apiKey, SALT_ROUNDS);
  
  const expiryDays = parseInt(process.env.API_KEY_EXPIRY_DAYS || '365');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  const result = await pool.query(
    `INSERT INTO apps (name, owner_email, api_key_hash, expires_at) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, name, owner_email, created_at, expires_at`,
    [name, ownerEmail, apiKeyHash, expiresAt]
  );

  return {
    app: result.rows[0],
    apiKey,
  };
}

async function verifyApiKey(apiKey) {
  const apps = await pool.query('SELECT * FROM apps WHERE revoked = FALSE');
  
  for (const app of apps.rows) {
    const isValid = await bcrypt.compare(apiKey, app.api_key_hash);
    if (isValid) {
      if (app.expires_at && new Date(app.expires_at) < new Date()) {
        return null;
      }
      return app;
    }
  }
  
  return null;
}

async function revokeApiKey(appId) {
  const result = await pool.query(
    'UPDATE apps SET revoked = TRUE WHERE id = $1 RETURNING *',
    [appId]
  );
  return result.rows[0];
}

async function regenerateApiKey(appId) {
  const apiKey = generateApiKey();
  const apiKeyHash = await bcrypt.hash(apiKey, SALT_ROUNDS);
  
  const result = await pool.query(
    'UPDATE apps SET api_key_hash = $1, revoked = FALSE WHERE id = $2 RETURNING id, name, owner_email',
    [apiKeyHash, appId]
  );

  return {
    app: result.rows[0],
    apiKey,
  };
}

async function getAppByEmail(email) {
  const result = await pool.query(
    'SELECT id, name, owner_email, revoked, expires_at, created_at FROM apps WHERE owner_email = $1',
    [email]
  );
  return result.rows[0];
}

module.exports = {
  createApp,
  verifyApiKey,
  revokeApiKey,
  regenerateApiKey,
  getAppByEmail,
};
