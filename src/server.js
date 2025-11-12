require('dotenv').config();
const app = require('./app');
const { initRedis } = require('./services/cache');
const pool = require('./services/db');
const logger = require('./services/logger');

const PORT = process.env.PORT || 4000;

async function startServer() {
  let dbConnected = false;
  let redisConnected = false;

  // Test database connection
  try {
    await pool.query('SELECT NOW()');
    logger.info('✓ Database connected successfully');
    dbConnected = true;
  } catch (dbError) {
    logger.warn('✗ Database connection failed');
    logger.warn('  Run: docker-compose up');
    logger.warn('  Or see LOCAL_SETUP.md for manual setup');
  }

  // Initialize Redis
  try {
    await initRedis();
    logger.info('✓ Redis connected successfully');
    redisConnected = true;
  } catch (redisError) {
    logger.warn('✗ Redis connection failed (caching disabled)');
  }

  // Start server anyway
  app.listen(PORT, () => {
    logger.info('');
    logger.info('='.repeat(50));
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📚 API Docs: http://localhost:${PORT}/docs`);
    logger.info(`💚 Health: http://localhost:${PORT}/`);
    logger.info('='.repeat(50));
    logger.info('');
    
    if (!dbConnected || !redisConnected) {
      logger.warn('⚠️  Some services are not connected:');
      if (!dbConnected) logger.warn('   - PostgreSQL (required for API functionality)');
      if (!redisConnected) logger.warn('   - Redis (optional, caching disabled)');
      logger.warn('');
      logger.warn('💡 Quick fix: docker-compose up');
      logger.warn('📖 Full guide: See LOCAL_SETUP.md');
    }
  });
}

startServer();
