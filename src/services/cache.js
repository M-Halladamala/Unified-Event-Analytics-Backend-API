const redis = require('redis');
const logger = require('./logger');

let client = null;
let connectionAttempted = false;

async function initRedis() {
  if (connectionAttempted) return client;
  connectionAttempted = true;

  try {
    const redisConfig = {
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT) || 6379,
        reconnectStrategy: false, // Disable auto-reconnect
      },
    };

    // Add password if provided (for Upstash or other external Redis)
    if (process.env.REDIS_PASSWORD) {
      redisConfig.password = process.env.REDIS_PASSWORD;
    }

    // Enable TLS for Upstash (external Redis services usually require TLS)
    if (process.env.REDIS_HOST && process.env.REDIS_HOST.includes('upstash.io')) {
      redisConfig.socket.tls = true;
    }

    client = redis.createClient(redisConfig);

    // Suppress error logs after initial connection attempt
    let errorLogged = false;
    client.on('error', (err) => {
      if (!errorLogged) {
        logger.warn('Redis connection failed (caching disabled)');
        errorLogged = true;
      }
    });

    client.on('connect', () => logger.info('Redis connected'));

    await client.connect();
    return client;
  } catch (error) {
    client = null;
    return null;
  }
}

async function getCache(key) {
  if (!client) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
}

async function setCache(key, value, ttl = 300) {
  if (!client) return false;
  try {
    await client.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error('Cache set error:', error);
    return false;
  }
}

async function deleteCache(key) {
  if (!client) return false;
  try {
    await client.del(key);
    return true;
  } catch (error) {
    logger.error('Cache delete error:', error);
    return false;
  }
}

module.exports = {
  initRedis,
  getCache,
  setCache,
  deleteCache,
};
