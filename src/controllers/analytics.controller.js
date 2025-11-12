const pool = require('../services/db');
const { getCache, setCache } = require('../services/cache');
const logger = require('../services/logger');

async function collectEvent(req, res) {
  try {
    const { event, url, referrer, device, ipAddress, timestamp, userId, metadata } = req.body;
    const appId = req.app_id;

    const eventTimestamp = timestamp ? new Date(timestamp) : new Date();

    await pool.query(
      `INSERT INTO events (app_id, event, url, referrer, device, ip_address, timestamp, user_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [appId, event, url, referrer, device, ipAddress, eventTimestamp, userId, metadata]
    );

    logger.debug(`Event collected: ${event} for app: ${appId}`);

    res.status(201).json({
      success: true,
      message: 'Event collected successfully',
    });
  } catch (error) {
    logger.error('Collect event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to collect event',
    });
  }
}

async function getEventSummary(req, res) {
  try {
    const { event, startDate, endDate, app_id } = req.query;
    const appId = app_id || req.app_id;

    const cacheKey = `summary:${appId}:${event}:${startDate}:${endDate}`;
    const cached = await getCache(cacheKey);
    
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    let query = `
      SELECT 
        event,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users,
        jsonb_object_agg(COALESCE(device, 'unknown'), device_count) as device_data
      FROM (
        SELECT 
          event,
          user_id,
          device,
          COUNT(*) as device_count
        FROM events
        WHERE app_id = $1
    `;

    const params = [appId];
    let paramIndex = 2;

    if (event) {
      query += ` AND event = $${paramIndex}`;
      params.push(event);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND timestamp >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND timestamp <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += `
        GROUP BY event, user_id, device
      ) subquery
      GROUP BY event
    `;

    const result = await pool.query(query, params);

    const summary = result.rows.map(row => ({
      event: row.event,
      count: parseInt(row.count),
      uniqueUsers: parseInt(row.unique_users),
      deviceData: row.device_data,
    }));

    await setCache(cacheKey, summary, 300);

    res.json({
      success: true,
      data: summary,
      cached: false,
    });
  } catch (error) {
    logger.error('Get event summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve event summary',
    });
  }
}

async function getUserStats(req, res) {
  try {
    const { userId, startDate, endDate } = req.query;
    const appId = req.app_id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId query parameter is required',
      });
    }

    const cacheKey = `userstats:${appId}:${userId}:${startDate}:${endDate}`;
    const cached = await getCache(cacheKey);
    
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    let query = `
      SELECT 
        user_id,
        COUNT(*) as total_events,
        jsonb_agg(
          jsonb_build_object(
            'event', event,
            'timestamp', timestamp,
            'url', url,
            'device', device
          ) ORDER BY timestamp DESC
        ) FILTER (WHERE rn <= 10) as recent_events,
        MAX(metadata) as device_details,
        MAX(ip_address) as ip_address
      FROM (
        SELECT 
          *,
          ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY timestamp DESC) as rn
        FROM events
        WHERE app_id = $1 AND user_id = $2
    `;

    const params = [appId, userId];
    let paramIndex = 3;

    if (startDate) {
      query += ` AND timestamp >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND timestamp <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += `
      ) subquery
      GROUP BY user_id
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userStats = {
      userId: result.rows[0].user_id,
      totalEvents: parseInt(result.rows[0].total_events),
      deviceDetails: result.rows[0].device_details,
      ipAddress: result.rows[0].ip_address,
      recentEvents: result.rows[0].recent_events || [],
    };

    await setCache(cacheKey, userStats, 300);

    res.json({
      success: true,
      data: userStats,
      cached: false,
    });
  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user stats',
    });
  }
}

module.exports = {
  collectEvent,
  getEventSummary,
  getUserStats,
};
