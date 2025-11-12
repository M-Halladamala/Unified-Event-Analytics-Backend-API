const crypto = require('crypto');

/**
 * Generate a secure random API key
 * @returns {string} API key in format: ak_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 */
function generateApiKey() {
  const randomBytes = crypto.randomBytes(32);
  const key = randomBytes.toString('hex');
  return `ak_${key}`;
}

module.exports = { generateApiKey };
