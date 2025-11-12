# Docker Deployment Guide

Complete guide for running the Analytics Backend API with Docker.

## Prerequisites

- Docker Desktop installed (Windows/Mac) or Docker Engine (Linux)
- Docker Compose installed (usually comes with Docker Desktop)

## Quick Start

### 1. Start All Services

```bash
docker-compose up
```

This will start:
- **API Server** on http://localhost:4000
- **PostgreSQL** on localhost:5432
- **Redis** on localhost:6379

The database will be automatically initialized with tables and indexes.

### 2. Run in Background (Detached Mode)

```bash
docker-compose up -d
```

### 3. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis
```

### 4. Stop Services

```bash
docker-compose down
```

### 5. Stop and Remove Volumes (Clean Slate)

```bash
docker-compose down -v
```

This removes all data (database and cache).

## Docker Commands Reference

### Build and Start

```bash
# Build images and start
docker-compose up --build

# Force rebuild
docker-compose build --no-cache
docker-compose up
```

### Service Management

```bash
# Start services
docker-compose start

# Stop services (keeps containers)
docker-compose stop

# Restart a specific service
docker-compose restart app

# Remove stopped containers
docker-compose rm
```

### Viewing Status

```bash
# List running containers
docker-compose ps

# View resource usage
docker stats
```

### Accessing Services

```bash
# Access PostgreSQL shell
docker-compose exec postgres psql -U postgres -d analytics_db

# Access Redis CLI
docker-compose exec redis redis-cli

# Access API container shell
docker-compose exec app sh
```

### Database Operations

```bash
# Run SQL commands
docker-compose exec postgres psql -U postgres -d analytics_db -c "SELECT * FROM apps;"

# Backup database
docker-compose exec postgres pg_dump -U postgres analytics_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres analytics_db < backup.sql
```

## Environment Variables

You can customize settings by creating a `.env` file:

```env
# API Configuration
NODE_ENV=production
PORT=4000
API_KEY_EXPIRY_DAYS=365

# Database
POSTGRES_DB=analytics_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# Redis
REDIS_MAX_MEMORY=256mb
```

Then reference in `docker-compose.yml`:

```yaml
environment:
  - DB_PASSWORD=${POSTGRES_PASSWORD}
```

## Production Deployment

### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml analytics

# List services
docker service ls

# Scale API service
docker service scale analytics_app=3
```

### Using Kubernetes

Convert docker-compose to Kubernetes:

```bash
# Install kompose
curl -L https://github.com/kubernetes/kompose/releases/download/v1.31.2/kompose-linux-amd64 -o kompose
chmod +x kompose
sudo mv kompose /usr/local/bin/

# Convert
kompose convert

# Deploy
kubectl apply -f .
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 4000
lsof -i :4000  # Mac/Linux
netstat -ano | findstr :4000  # Windows

# Change port in docker-compose.yml
ports:
  - "4001:4000"  # Use 4001 instead
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Container Keeps Restarting

```bash
# View logs
docker-compose logs app

# Check container status
docker-compose ps

# Inspect container
docker inspect analytics-api
```

### Out of Disk Space

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a --volumes
```

### Slow Performance

```bash
# Increase Docker resources
# Docker Desktop → Settings → Resources
# - CPUs: 4+
# - Memory: 4GB+
# - Swap: 1GB+

# Check resource usage
docker stats
```

## Health Checks

All services include health checks:

```bash
# Check health status
docker-compose ps

# Healthy services show "healthy" status
# Unhealthy services show "unhealthy"
```

## Networking

Services communicate over a private network:

```bash
# List networks
docker network ls

# Inspect network
docker network inspect analytics_analytics-network

# Test connectivity
docker-compose exec app ping postgres
docker-compose exec app ping redis
```

## Volumes and Data Persistence

Data is stored in Docker volumes:

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect analytics_postgres_data

# Backup volume
docker run --rm -v analytics_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data

# Restore volume
docker run --rm -v analytics_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /
```

## Security Best Practices

1. **Change default passwords** in production
2. **Use secrets** for sensitive data:
   ```bash
   echo "my_password" | docker secret create db_password -
   ```
3. **Limit container resources**:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
   ```
4. **Run as non-root user** (already configured in Dockerfile)
5. **Keep images updated**:
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

## Multi-Stage Builds (Advanced)

For smaller production images, use multi-stage builds:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./
CMD ["npm", "start"]
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Docker Build
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build image
        run: docker build -t analytics-api .
      - name: Run tests
        run: docker-compose run app npm test
```

## Monitoring

### View Logs with Timestamps

```bash
docker-compose logs -f --timestamps
```

### Export Logs

```bash
docker-compose logs > logs.txt
```

### Real-time Monitoring

```bash
# Install ctop
docker run --rm -ti -v /var/run/docker.sock:/var/run/docker.sock quay.io/vektorlab/ctop:latest
```

## Next Steps

1. Test your API: http://localhost:4000
2. View docs: http://localhost:4000/docs
3. Access database: `docker-compose exec postgres psql -U postgres -d analytics_db`
4. Monitor logs: `docker-compose logs -f`
5. Deploy to production (see DEPLOYMENT.md)

## Support

For issues:
- Check logs: `docker-compose logs`
- Restart services: `docker-compose restart`
- Clean start: `docker-compose down -v && docker-compose up`
- GitHub Issues: [Your repo URL]

Happy Dockerizing! 🐳
