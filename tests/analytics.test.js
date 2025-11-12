const request = require('supertest');
const app = require('../src/app');

describe('Analytics API', () => {
  const testApiKey = 'ak_test_key_for_testing';

  describe('POST /api/analytics/collect', () => {
    it('should collect an event with valid API key', async () => {
      const res = await request(app)
        .post('/api/analytics/collect')
        .set('x-api-key', testApiKey)
        .send({
          event: 'page_view',
          url: 'https://example.com',
          referrer: 'https://google.com',
          device: 'mobile',
          userId: 'user123',
          metadata: {
            browser: 'Chrome',
            os: 'Android',
          },
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should fail without API key', async () => {
      const res = await request(app)
        .post('/api/analytics/collect')
        .send({
          event: 'page_view',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/analytics/event-summary', () => {
    it('should return event summary', async () => {
      const res = await request(app)
        .get('/api/analytics/event-summary')
        .set('x-api-key', testApiKey)
        .query({ event: 'page_view' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
