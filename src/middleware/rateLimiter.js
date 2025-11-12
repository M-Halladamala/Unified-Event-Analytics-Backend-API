const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs: windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
      success: false,
      error: message || 'Too many requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

const authLimiter = createRateLimiter(15 * 60 * 1000, 10, 'Too many authentication attempts');
const analyticsLimiter = createRateLimiter(15 * 60 * 1000, 1000, 'Too many analytics requests');

module.exports = {
  createRateLimiter,
  authLimiter,
  analyticsLimiter,
};
