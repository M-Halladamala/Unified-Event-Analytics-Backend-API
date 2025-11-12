# Unified Event Analytics Backend API

A scalable, production-ready backend API for collecting and analyzing web and mobile analytics events. Built with Node.js, Express, PostgreSQL, and Redis.

## Features

- **API Key Management**: Secure registration, revocation, and regeneration
- **Event Collection**: High-throughput event ingestion with validation
- **Analytics & Reporting**: Aggregated statistics with caching
- **Security**: Rate limiting, API key hashing, helmet protection
- **Scalability**: Redis caching, optimized database indexes
- **Containerization**: Docker and docker-compose support
- **Documentation**: Swagger/OpenAPI 3.0 interactive docs

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Security**: bcrypt, helmet, CORS, rate limiting
- **Testing**: Jest + Supertest
- **Documentation**: Swagger UI

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (recommended)
- PostgreSQL 15+ (if running locally)
- Redis 7+ (if running locally)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd analytics-backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start with Docker Compose (recommended):
```bash
docker-compose up -d
```

Or run locally:
```bash
npm start
```

The API will be available at `http://localhost:4000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new app and get API key
- `POST /api/auth/api-key` - Retrieve app info by email
- `POST /api/auth/revoke` - Revoke API key
- `POST /api/auth/regenerate` - Regenerate API key

### Analytics

- `POST /api/analytics/collect` - Collect analytics event (requires API key)
- `GET /api/analytics/event-summary` - Get event statistics (requires API key)
- `GET /api/analytics/user-stats` - Get user statistics (requires API key)

### Documentation

- `GET /` - Health check
- `GET /docs` - Interactive Swagger documentation

## Usage Examples

### 1. Register an App

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Website",
    "ownerEmail": "owner@example.com"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "appId": "uuid-here",
    "name": "My Website",
    "apiKey": "ak_xxxxxxxxxxxxxxxx",
    "expiresAt": "2025-11-12T00:00:00.000Z"
  }
}
```

### 2. Collect an Event

```bash
curl -X POST http://localhost:4000/api/analytics/collect \
  -H "Content-Type: application/json" \
  -H "x-api-key: ak_xxxxxxxxxxxxxxxx" \
  -d '{
    "event": "button_click",
    "url": "https://example.com/page",
    "referrer": "https://google.com",
    "device": "mobile",
    "userId": "user123",
    "metadata": {
      "browser": "Chrome",
      "os": "Android"
    }
  }'
```

### 3. Get Event Summary

```bash
curl -X GET "http://localhost:4000/api/analytics/event-summary?event=button_click" \
  -H "x-api-key: ak_xxxxxxxxxxxxxxxx"
```

## Database Schema

### apps table
- `id` (UUID) - Primary key
- `name` (TEXT) - App name
- `owner_email` (TEXT) - Owner email
- `api_key_hash` (TEXT) - Hashed API key
- `revoked` (BOOLEAN) - Revocation status
- `expires_at` (TIMESTAMP) - Expiration date
- `created_at` (TIMESTAMP) - Creation timestamp

### events table
- `id` (BIGSERIAL) - Primary key
- `app_id` (UUID) - Foreign key to apps
- `event` (TEXT) - Event name
- `url` (TEXT) - Event URL
- `referrer` (TEXT) - Referrer URL
- `device` (TEXT) - Device type
- `ip_address` (TEXT) - IP address
- `timestamp` (TIMESTAMP) - Event timestamp
- `metadata` (JSONB) - Additional data
- `user_id` (TEXT) - User identifier
- `created_at` (TIMESTAMP) - Record creation

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Deployment

### Render Deployment (Recommended)

This project includes a `render.yaml` blueprint for one-click deployment.

#### Option 1: Deploy with Blueprint (Easiest)

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Render will automatically create:
   - Web Service (Node.js API)
   - PostgreSQL Database
   - Redis Instance
6. Click "Apply" and wait for deployment

#### Option 2: Manual Deployment

**Step 1: Create PostgreSQL Database**
1. Go to Render Dashboard → "New" → "PostgreSQL"
2. Name: `analytics-postgres`
3. Database: `analytics_db`
4. Plan: Free
5. Click "Create Database"
6. Once created, go to "Connect" tab and note the connection details

**Step 2: Run Database Migrations**
1. Connect to your database using the Internal Database URL
2. Run the SQL from `scripts/init-db.sql` or `src/models/migrations.sql`
3. You can use Render's built-in psql shell or any PostgreSQL client

**Step 3: Create Redis Instance**
1. Go to Render Dashboard → "New" → "Redis"
2. Name: `analytics-redis`
3. Plan: Free
4. Click "Create Redis"

**Step 4: Create Web Service**
1. Go to Render Dashboard → "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `analytics-backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

**Step 5: Set Environment Variables**

Add these in the "Environment" tab:
```
NODE_ENV=production
PORT=4000
API_KEY_EXPIRY_DAYS=365
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=*

# Database (from PostgreSQL service)
DB_HOST=<your-postgres-host>
DB_PORT=5432
DB_NAME=analytics_db
DB_USER=<your-postgres-user>
DB_PASSWORD=<your-postgres-password>

# Redis (from Redis service)
REDIS_HOST=<your-redis-host>
REDIS_PORT=6379
```

**Step 6: Deploy**
- Click "Create Web Service"
- Render will build and deploy your app
- Your API will be live at: `https://analytics-backend.onrender.com`

### Docker Deployment (Optional - Local Development Only)

Docker is **NOT required** for Render deployment. Use Docker only if you want to run the project locally:

```bash
docker-compose up --build -d
```

Note: Render will ignore `Dockerfile` and `docker-compose.yml` files.

### Important Notes for Render

- **Free tier limitations**: Services may spin down after inactivity (cold starts)
- **Database persistence**: Free PostgreSQL has 90-day data retention
- **Redis persistence**: Free Redis is ephemeral (cache only)
- **Custom domain**: Available on paid plans
- **Health checks**: Enabled at `/` endpoint

## Performance Optimizations

- **Database Indexes**: Optimized for common queries
- **Redis Caching**: 5-minute TTL for analytics queries
- **Rate Limiting**: 100 requests per 15 minutes
- **Connection Pooling**: PostgreSQL connection pool (max 20)

## Security Features

- API keys hashed with bcrypt (10 rounds)
- Helmet.js for HTTP security headers
- CORS protection
- Rate limiting per IP and API key
- Input validation with Joi
- SQL injection prevention (parameterized queries)

## Future Improvements

- [ ] Real-time analytics with WebSockets
- [ ] Message queue integration (RabbitMQ/Kafka)
- [ ] Data partitioning for large-scale storage
- [ ] Machine learning insights
- [ ] Dashboard UI
- [ ] Export to CSV/JSON
- [ ] Webhook notifications
- [ ] Multi-region deployment

## License

MIT

## Render Deployment Checklist

- [ ] Push code to GitHub
- [ ] Create Render account
- [ ] Deploy using Blueprint or manual setup
- [ ] Run database migrations
- [ ] Test health check endpoint
- [ ] Test API key registration
- [ ] Update CORS_ORIGIN for production domains
- [ ] Monitor logs in Render dashboard

## Troubleshooting

### Database Connection Issues
- Verify all DB_* environment variables are set correctly
- Check if PostgreSQL service is running
- Ensure migrations have been executed

### Redis Connection Issues
- Redis is optional; app will work without it (no caching)
- Verify REDIS_HOST and REDIS_PORT are correct
- Check Redis service status in Render dashboard

### Cold Starts (Free Tier)
- Free tier services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Consider upgrading to paid plan for always-on service

## Support

For issues and questions, please open a GitHub issue.
