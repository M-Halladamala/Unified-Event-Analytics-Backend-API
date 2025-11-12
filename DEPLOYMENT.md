# Render Deployment Guide

Complete guide for deploying the Analytics Backend API to Render.

## Prerequisites

- GitHub account with your code pushed
- Render account (free tier available)
- Basic understanding of environment variables

## Important: Docker Not Required

Render has **native Node.js support**. You do NOT need Docker, Dockerfile, or docker-compose.yml for Render deployment. Render will:
- Automatically detect your Node.js app
- Run `npm install` to install dependencies
- Execute `npm start` to run your server

The Docker files in this project are only for local development if you prefer containerization.

## Quick Deploy (Blueprint Method)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy on Render**
   - Go to https://dashboard.render.com/
   - Click "New" → "Blueprint"
   - Select your repository
   - Render reads `render.yaml` and creates all services
   - Click "Apply"

3. **Initialize Database**
   - Go to your PostgreSQL service in Render
   - Click "Connect" → "External Connection"
   - Use the provided connection string with psql:
     ```bash
     psql <connection-string>
     ```
   - Copy and paste contents from `scripts/init-db.sql`
   - Or use Render's built-in shell

4. **Verify Deployment**
   - Open your web service URL (e.g., `https://analytics-backend.onrender.com`)
   - You should see the health check response
   - Visit `/docs` for Swagger documentation

## Manual Deployment Steps

### 1. Create PostgreSQL Database

```
Dashboard → New → PostgreSQL
- Name: analytics-postgres
- Database: analytics_db
- Region: Oregon (or closest to you)
- Plan: Free
```

Save these values after creation:
- Internal Database URL
- External Database URL
- Host, Port, Database, User, Password

### 2. Run Migrations

**Option A: Using Render Shell**
1. Go to PostgreSQL service → "Shell" tab
2. Paste SQL from `scripts/init-db.sql`

**Option B: Using Local psql**
```bash
psql <external-database-url> < scripts/init-db.sql
```

**Option C: Using GUI Tool**
- Use TablePlus, pgAdmin, or DBeaver
- Connect with external URL
- Run migration script

### 3. Create Redis Instance

```
Dashboard → New → Redis
- Name: analytics-redis
- Region: Oregon (same as database)
- Plan: Free
- Max Memory Policy: allkeys-lru
```

Note the connection details:
- Internal Redis URL
- Host and Port

### 4. Create Web Service

```
Dashboard → New → Web Service
- Connect GitHub repository
- Name: analytics-backend
- Environment: Node
- Region: Oregon
- Branch: main
- Build Command: npm install
- Start Command: npm start
```

### 5. Configure Environment Variables

In Web Service → Environment tab, add:

```bash
# Application
NODE_ENV=production
PORT=4000

# API Configuration
API_KEY_EXPIRY_DAYS=365
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS (update with your domains)
CORS_ORIGIN=*

# Database (from Step 1)
DB_HOST=dpg-xxxxx.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=analytics_db
DB_USER=analytics_user
DB_PASSWORD=<your-password>

# Redis (from Step 3)
REDIS_HOST=red-xxxxx.oregon-redis.render.com
REDIS_PORT=6379
```

### 6. Deploy

- Click "Create Web Service"
- Monitor build logs
- Wait for "Live" status
- Test your API

## Post-Deployment

### Test Your API

1. **Health Check**
   ```bash
   curl https://your-app.onrender.com/
   ```

2. **Register an App**
   ```bash
   curl -X POST https://your-app.onrender.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test App",
       "ownerEmail": "test@example.com"
     }'
   ```

3. **Collect an Event**
   ```bash
   curl -X POST https://your-app.onrender.com/api/analytics/collect \
     -H "Content-Type: application/json" \
     -H "x-api-key: <your-api-key>" \
     -d '{
       "event": "test_event",
       "url": "https://example.com",
       "device": "mobile"
     }'
   ```

### Monitor Your Services

- **Logs**: Web Service → Logs tab
- **Metrics**: Web Service → Metrics tab
- **Database**: PostgreSQL → Metrics tab
- **Redis**: Redis → Info tab

## Production Optimizations

### 1. Update CORS Settings

Change `CORS_ORIGIN` from `*` to your specific domains:
```bash
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
```

### 2. Upgrade Plans (Optional)

**Free Tier Limitations:**
- Services spin down after 15 min inactivity
- 750 hours/month shared across services
- PostgreSQL: 1GB storage, 90-day retention
- Redis: 25MB, ephemeral

**Paid Plans Benefits:**
- Always-on services (no cold starts)
- More resources (RAM, CPU)
- Persistent Redis
- Custom domains with SSL
- Priority support

### 3. Add Custom Domain

1. Go to Web Service → Settings
2. Click "Add Custom Domain"
3. Enter your domain
4. Update DNS records as instructed
5. SSL certificate auto-provisioned

### 4. Set Up Monitoring

Consider adding:
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry
- **APM**: New Relic, DataDog

## Troubleshooting

### Build Fails

**Error: Module not found**
- Check `package.json` dependencies
- Ensure all files are committed to Git

**Error: Node version mismatch**
- Verify `engines` in `package.json`
- Render uses Node 18+ by default

### Database Connection Fails

**Error: Connection refused**
- Use Internal Database URL (not external)
- Format: `postgres://user:pass@host:5432/dbname`
- Check environment variables are set

**Error: Relation does not exist**
- Migrations not run
- Connect to database and run `scripts/init-db.sql`

### Redis Connection Fails

**Error: ECONNREFUSED**
- Check REDIS_HOST and REDIS_PORT
- Use Internal Redis URL
- Redis is optional; app works without it

### Service Keeps Restarting

- Check logs for errors
- Verify all environment variables
- Test database connection
- Ensure port 4000 is used

### Cold Start Issues (Free Tier)

- First request takes 30-60 seconds
- Set up a cron job to ping your API every 10 minutes
- Or upgrade to paid plan

## Maintenance

### Update Code

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render auto-deploys on push (if enabled).

### Manual Deploy

Dashboard → Web Service → Manual Deploy → Deploy latest commit

### View Logs

Dashboard → Web Service → Logs (real-time)

### Database Backup

1. Go to PostgreSQL service
2. Click "Backups" tab
3. Manual backup or schedule automatic backups (paid plans)

### Scale Resources

Dashboard → Web Service → Settings → Instance Type

## Security Checklist

- [ ] Change default database password
- [ ] Set specific CORS_ORIGIN (not *)
- [ ] Enable HTTPS only (automatic on Render)
- [ ] Rotate API keys regularly
- [ ] Monitor rate limiting logs
- [ ] Set up alerts for errors
- [ ] Review access logs periodically

## Cost Estimation

**Free Tier:**
- Web Service: $0
- PostgreSQL: $0
- Redis: $0
- Total: $0/month (with limitations)

**Starter Tier:**
- Web Service: $7/month
- PostgreSQL: $7/month
- Redis: $10/month
- Total: $24/month (no limitations)

## Support Resources

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com/)
- [Status Page](https://status.render.com/)
- Project Issues: GitHub Issues

## Next Steps

1. Deploy your API
2. Test all endpoints
3. Integrate with your frontend
4. Monitor performance
5. Scale as needed

Happy deploying! 🚀
