const request = require('supertest');
const app = require('../src/app');

describe('Auth API', () => {
  let apiKey;
  let appId;

  describe('POST /api/auth/register', () => {
    it('should register a new app', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test App',
          ownerEmail: 'test@example.com',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('apiKey');
      expect(res.body.data).toHaveProperty('appId');

      apiKey = res.body.data.apiKey;
      appId = res.body.data.appId;
    });

    it('should fail with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test App',
          ownerEmail: 'invalid-email',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/api-key', () => {
    it('should retrieve app info by email', async () => {
      const res = await request(app)
        .post('/api/auth/api-key')
        .send({
          email: 'test@example.com',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('appId');
    });
  });
});
