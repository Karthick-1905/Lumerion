# 🚀 Deployment Guide

This guide covers deploying ADL LMS to various environments and platforms.

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+
- Redis 6+ (optional)
- Domain name (for production)

## 🐳 Docker Deployment

### Quick Start with Docker Compose

1. **Clone the repository**
   ```bash
   git clone https://github.com/Karthick-1905/adl_lms.git
   cd adl_lms
   ```

2. **Create environment file**
   ```bash
   cp docker/.env.example docker/.env
   # Edit docker/.env with your configuration
   ```

3. **Start services**
   ```bash
   docker-compose -f docker/docker-compose.yml up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/api-docs

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: adl_lms
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ../backend
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/adl_lms
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-secret-key
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis

  frontend:
    build: ../frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## ☁️ Cloud Deployment

### Vercel (Frontend)

1. **Connect repository to Vercel**
2. **Configure build settings**:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "installCommand": "npm install",
     "devCommand": "npm run dev"
   }
   ```

3. **Set environment variables**:
   - `VITE_API_BASE_URL`: Your backend API URL

### Railway (Backend + Database)

1. **Create new project**
2. **Connect GitHub repository**
3. **Configure environment variables**
4. **Deploy automatically**

### AWS Deployment

#### Option 1: EC2 + RDS

1. **Launch EC2 instance**
   ```bash
   # Ubuntu 22.04 LTS
   sudo apt update
   sudo apt install nodejs npm postgresql redis-server
   ```

2. **Configure RDS PostgreSQL**
3. **Deploy application**
   ```bash
   git clone https://github.com/Karthick-1905/adl_lms.git
   cd adl_lms/backend
   npm install
   npm run build
   npm start
   ```

#### Option 2: ECS + Fargate

1. **Create ECR repositories**
2. **Build and push Docker images**
3. **Create ECS cluster and services**
4. **Configure load balancer and domain**

### Google Cloud Platform

#### App Engine (Flexible)

1. **Create `app.yaml`**
   ```yaml
   runtime: nodejs18
   env_variables:
     DATABASE_URL: postgresql://...
     REDIS_URL: redis://...
   ```

2. **Deploy**
   ```bash
   gcloud app deploy
   ```

#### Cloud Run

1. **Build container image**
2. **Deploy to Cloud Run**
3. **Configure environment variables**

## 🔧 Environment Configuration

### Production Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://host:6379

# Authentication
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AI Services
GOOGLE_AI_API_KEY=your-google-ai-key
TAVILY_API_KEY=your-tavily-key

# Application
NODE_ENV=production
PORT=8000
CORS_ORIGIN=https://yourdomain.com

# Security
SESSION_SECRET=your-session-secret
```

### SSL/TLS Configuration

#### Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Configure Nginx to use SSL
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 Monitoring & Logging

### Application Monitoring

#### PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/server.js --name "adl-lms-backend"

# Configure PM2 startup
pm2 startup
pm2 save
```

#### Health Checks

```bash
# Backend health check
curl http://localhost:8000/api/health

# Database connectivity
curl http://localhost:8000/api/health/database
```

### Logging

#### Winston Logger Configuration

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

### Database Monitoring

#### Connection Pool Monitoring

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Monitor pool events
pool.on('connect', (client) => {
  console.log('New client connected to database');
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});
```

## 🔒 Security Checklist

### Pre-deployment Security

- [ ] Change default passwords
- [ ] Use strong, unique JWT secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable CORS properly
- [ ] Use environment variables for secrets
- [ ] Regular security updates

### Database Security

- [ ] Use parameterized queries
- [ ] Implement row-level security
- [ ] Regular database backups
- [ ] Encrypt sensitive data
- [ ] Monitor for SQL injection

### API Security

- [ ] Implement input validation
- [ ] Use HTTPS for all requests
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] Use API versioning
- [ ] Implement proper error handling

## 🚀 Performance Optimization

### Frontend Optimization

```bash
# Build optimized production bundle
npm run build

# Analyze bundle size
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/static/js/*.js
```

### Backend Optimization

```typescript
// Enable gzip compression
import compression from 'compression';
app.use(compression());

// Implement caching
import apicache from 'apicache';
app.use(apicache.middleware('5 minutes'));
```

### Database Optimization

```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_learning_path_user_id ON learning_path(user_id);
CREATE INDEX idx_user_module_progress_user_id ON user_module_progress(user_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM learning_path WHERE user_id = $1;
```

## 🔄 Backup & Recovery

### Database Backup

```bash
# PostgreSQL backup
pg_dump -U username -h hostname database_name > backup.sql

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U username database_name > backup_$DATE.sql
```

### File System Backup

```bash
# Backup uploaded files
tar -czf uploads_backup.tar.gz uploads/

# Backup configuration files
cp .env .env.backup
```

### Recovery Procedures

1. **Database Recovery**
   ```bash
   psql -U username -d database_name < backup.sql
   ```

2. **Application Rollback**
   ```bash
   git checkout previous-version-tag
   npm install
   npm run build
   pm2 restart adl-lms-backend
   ```

## 📞 Support

For deployment issues:
- Check application logs
- Verify environment variables
- Test database connectivity
- Review firewall settings
- Check system resources

## 📝 Changelog

### v1.0.0
- Initial deployment guide
- Docker Compose setup
- Basic cloud deployment options
- Security and performance guidelines