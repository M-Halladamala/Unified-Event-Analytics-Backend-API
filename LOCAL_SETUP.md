# Local Development Setup

## Quick Start with Docker (Recommended)

The easiest way to run the project locally with all dependencies:

```bash
# Start all services (PostgreSQL, Redis, and API)
docker-compose up

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The API will be available at:
- **API**: http://localhost:4000
- **Swagger Docs**: http://localhost:4000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Manual Setup (Without Docker)

If you prefer to run services separately:

### 1. Install PostgreSQL

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Install and remember your password
- Default port: 5432

**Mac:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux:**
```bash
sudo apt-get install postgresql-15
sudo systemctl start postgresql
```

### 2. Install Redis

**Windows:**
- Download from https://github.com/microsoftarchive/redis/releases
- Or use WSL: `wsl --install` then `sudo apt install redis-server`

**Mac:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### 3. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE analytics_db;

# Exit
\q

# Run migrations
psql -U postgres -d analytics_db -f scripts/init-db.sql
```

### 4. Configure Environment

Copy `.env.example` to `.env` and update if needed:
```bash
cp .env.example .env
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## Testing the API

### 1. Health Check
```bash
curl http://localhost:4000/
```

### 2. Register an App
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test App",
    "ownerEmail": "test@example.com"
  }'
```

Save the `apiKey` from the response!

### 3. Collect an Event
```bash
curl -X POST http://localhost:4000/api/analytics/collect \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -d '{
    "event": "page_view",
    "url": "https://example.com",
    "device": "mobile",
    "userId": "user123"
  }'
```

### 4. Get Event Summary
```bash
curl -X GET "http://localhost:4000/api/analytics/event-summary?event=page_view" \
  -H "x-api-key: YOUR_API_KEY_HERE"
```

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Check if PostgreSQL is running: `pg_isready`
- Verify credentials in `.env` file
- Or use Docker: `docker-compose up`

### Redis Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:**
- Check if Redis is running: `redis-cli ping` (should return PONG)
- Redis is optional - app works without it (no caching)
- Or use Docker: `docker-compose up`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::4000
```

**Solution:**
- Change PORT in `.env` file
- Or kill the process using port 4000:
  - Windows: `netstat -ano | findstr :4000` then `taskkill /PID <PID> /F`
  - Mac/Linux: `lsof -ti:4000 | xargs kill`

### Module Not Found
```
Error: Cannot find module 'express'
```

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## Development Tips

### Watch Mode
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### View Logs
The app uses Winston for logging. Logs appear in the console with colors:
- **Error**: Red
- **Warn**: Yellow
- **Info**: Green
- **Debug**: Blue

### Database GUI Tools
- **pgAdmin**: https://www.pgadmin.org/
- **DBeaver**: https://dbeaver.io/
- **TablePlus**: https://tableplus.com/

### Redis GUI Tools
- **RedisInsight**: https://redis.com/redis-enterprise/redis-insight/
- **Redis Commander**: `npm install -g redis-commander`

## Next Steps

Once everything is running locally:
1. Test all API endpoints
2. Review Swagger documentation at http://localhost:4000/docs
3. Make your changes
4. Run tests: `npm test`
5. Deploy to Render (see DEPLOYMENT.md)

## Docker Commands Reference

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart app

# Rebuild after code changes
docker-compose up --build

# Remove all containers and volumes
docker-compose down -v

# Access PostgreSQL shell
docker-compose exec postgres psql -U postgres -d analytics_db

# Access Redis CLI
docker-compose exec redis redis-cli
```
