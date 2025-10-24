# 🔧 Troubleshooting Guide

Common issues and solutions for ADL LMS development and deployment.

## 🚀 Getting Started Issues

### Node.js Version Issues

**Problem:** `npm install` fails with Node.js version errors.

**Solution:**
```bash
# Check current Node.js version
node --version

# Use nvm to switch to correct version
nvm use 18
# or install Node.js 18
nvm install 18
nvm alias default 18
```

**Prevention:** Add `.nvmrc` file:
```
18
```

### Database Connection Issues

**Problem:** Application can't connect to PostgreSQL.

**Solutions:**

1. **Check PostgreSQL service:**
   ```bash
   # Linux
   sudo systemctl status postgresql

   # macOS
   brew services list | grep postgres

   # Start service
   sudo systemctl start postgresql
   ```

2. **Verify connection string:**
   ```bash
   # Test connection
   psql "postgresql://username:password@localhost:5432/database_name"
   ```

3. **Check environment variables:**
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/adl_lms
   ```

4. **Database doesn't exist:**
   ```bash
   createdb adl_lms
   ```

### Redis Connection Issues

**Problem:** Redis connection fails.

**Solutions:**

1. **Start Redis service:**
   ```bash
   # Linux
   sudo systemctl start redis-server

   # macOS
   brew services start redis

   # Windows (using WSL)
   sudo service redis-server start
   ```

2. **Check Redis status:**
   ```bash
   redis-cli ping
   # Should respond: PONG
   ```

3. **Verify Redis URL:**
   ```env
   REDIS_URL=redis://localhost:6379
   ```

## 🔧 Development Issues

### Build Failures

**Problem:** `npm run build` fails.

**Common Causes & Solutions:**

1. **TypeScript errors:**
   ```bash
   # Check for type errors
   npx tsc --noEmit

   # Fix common issues:
   # - Missing type definitions
   # - Incorrect import paths
   # - Type mismatches
   ```

2. **Missing dependencies:**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Outdated packages:**
   ```bash
   # Update dependencies
   npm update

   # Check for security vulnerabilities
   npm audit fix
   ```

### Test Failures

**Problem:** Tests are failing.

**Solutions:**

1. **Database not set up for tests:**
   ```bash
   # Create test database
   createdb adl_lms_test

   # Run migrations on test DB
   npm run db:migrate:test
   ```

2. **Environment variables missing:**
   ```bash
   # Copy test environment file
   cp .env.test.example .env.test
   ```

3. **Async test timeouts:**
   ```typescript
   // Increase timeout in jest.config.js
   testTimeout: 10000
   ```

### Hot Reload Not Working

**Problem:** Changes not reflecting in development server.

**Solutions:**

1. **File watching limits:**
   ```bash
   # Increase system file watching limits
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. **Clear cache:**
   ```bash
   # Clear Next.js/Vite cache
   rm -rf .next
   # or
   rm -rf node_modules/.vite
   ```

3. **Check file paths:**
   - Ensure files are within the watched directory
   - Check for symbolic links

## 🔐 Authentication Issues

### JWT Token Issues

**Problem:** Authentication fails with valid credentials.

**Solutions:**

1. **Invalid JWT secret:**
   ```env
   JWT_SECRET=your-super-secure-random-string
   ```

2. **Token expired:**
   - Tokens expire after 7 days by default
   - Implement token refresh logic

3. **Incorrect token format:**
   ```javascript
   // Correct format
   Authorization: Bearer <token>

   // Incorrect
   Authorization: <token>
   ```

### Password Reset Issues

**Problem:** Password reset emails not being sent.

**Solutions:**

1. **SMTP configuration:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

2. **Gmail app password:**
   - Enable 2FA on Gmail
   - Generate app password in Google Account settings

3. **Email service down:**
   - Check email service status
   - Use alternative SMTP provider

## 🗄️ Database Issues

### Migration Failures

**Problem:** Database migrations fail.

**Solutions:**

1. **Check migration status:**
   ```bash
   npx drizzle-kit generate
   npx drizzle-kit migrate
   ```

2. **Manual migration:**
   ```bash
   # View pending migrations
   npx drizzle-kit check

   # Apply migrations
   npx drizzle-kit push
   ```

3. **Rollback migration:**
   ```bash
   # If migration fails, rollback
   npx drizzle-kit drop
   ```

### Data Corruption

**Problem:** Database data appears corrupted.

**Solutions:**

1. **Backup data:**
   ```bash
   pg_dump adl_lms > backup.sql
   ```

2. **Reset database:**
   ```bash
   # Drop and recreate database
   dropdb adl_lms
   createdb adl_lms

   # Re-run migrations
   npm run db:migrate
   ```

3. **Restore from backup:**
   ```bash
   psql adl_lms < backup.sql
   ```

### Connection Pool Exhaustion

**Problem:** "Too many connections" error.

**Solutions:**

1. **Increase pool size:**
   ```typescript
   // In database config
   const pool = new Pool({
     max: 20, // Increase from default
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

2. **Check for connection leaks:**
   ```typescript
   // Ensure connections are released
   const client = await pool.connect();
   try {
     // ... use client
   } finally {
     client.release();
   }
   ```

## 🤖 AI Service Issues

### Google AI API Errors

**Problem:** AI features not working.

**Solutions:**

1. **API key issues:**
   ```env
   GOOGLE_AI_API_KEY=your-api-key
   ```

2. **Quota exceeded:**
   - Check Google AI Studio quota
   - Upgrade billing plan if needed

3. **API key permissions:**
   - Ensure API key has correct permissions
   - Check API restrictions

### Tavily Search API Issues

**Problem:** Web search features failing.

**Solutions:**

1. **API key configuration:**
   ```env
   TAVILY_API_KEY=your-api-key
   ```

2. **Rate limiting:**
   - Tavily has rate limits
   - Implement retry logic with backoff

## 🌐 Frontend Issues

### CORS Errors

**Problem:** Frontend can't communicate with backend.

**Solutions:**

1. **Backend CORS configuration:**
   ```typescript
   // In Express app
   app.use(cors({
     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
     credentials: true
   }));
   ```

2. **Environment variables:**
   ```env
   FRONTEND_URL=http://localhost:3000
   CORS_ORIGIN=http://localhost:3000
   ```

### Build Optimization Issues

**Problem:** Production build too large.

**Solutions:**

1. **Analyze bundle:**
   ```bash
   npm install -g webpack-bundle-analyzer
   npx webpack-bundle-analyzer dist/static/js/*.js
   ```

2. **Code splitting:**
   ```typescript
   // Dynamic imports for routes
   const HomePage = lazy(() => import('./pages/HomePage'));
   ```

3. **Tree shaking:**
   - Ensure ES6 imports are used
   - Remove unused dependencies

## 🚀 Deployment Issues

### Docker Build Failures

**Problem:** Docker build fails.

**Solutions:**

1. **Base image issues:**
   ```dockerfile
   # Use specific Node.js version
   FROM node:18-alpine
   ```

2. **Missing dependencies:**
   ```dockerfile
   # Install system dependencies
   RUN apk add --no-cache postgresql-client redis
   ```

3. **Build context:**
   ```bash
   # Build from correct directory
   docker build -f Dockerfile ../
   ```

### Environment Variable Issues

**Problem:** Application behaves differently in production.

**Solutions:**

1. **Missing environment variables:**
   ```bash
   # Check environment in container
   docker exec -it container_name env
   ```

2. **Incorrect variable names:**
   - Ensure consistent naming across environments
   - Use `.env.example` as reference

3. **Variable precedence:**
   - System environment variables override `.env` files
   - Check for conflicts

### SSL/HTTPS Issues

**Problem:** HTTPS not working in production.

**Solutions:**

1. **SSL certificate:**
   ```bash
   # Using Let's Encrypt
   sudo certbot certonly --webroot -w /var/www/html -d yourdomain.com
   ```

2. **Nginx configuration:**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

       location / {
           proxy_pass http://localhost:3000;
       }
   }
   ```

## 📊 Performance Issues

### Slow API Responses

**Problem:** API endpoints are slow.

**Solutions:**

1. **Database query optimization:**
   ```sql
   -- Add indexes
   CREATE INDEX idx_user_email ON users(email);

   -- Analyze query performance
   EXPLAIN ANALYZE SELECT * FROM users WHERE email = $1;
   ```

2. **Caching:**
   ```typescript
   // Implement Redis caching
   import { createClient } from 'redis';

   const redis = createClient();
   await redis.set('key', 'value', 'EX', 3600);
   ```

3. **Pagination:**
   ```typescript
   // Implement cursor-based pagination
   const query = sql`
     SELECT * FROM items
     WHERE id > ${cursor}
     ORDER BY id
     LIMIT ${limit}
   `;
   ```

### Memory Leaks

**Problem:** Application memory usage keeps growing.

**Solutions:**

1. **Check for memory leaks:**
   ```bash
   # Use clinic.js for diagnosis
   npm install -g clinic
   clinic heapprofiler -- node dist/server.js
   ```

2. **Garbage collection:**
   ```bash
   # Force garbage collection (development only)
   global.gc && global.gc();
   ```

3. **Connection cleanup:**
   - Ensure database connections are closed
   - Clean up event listeners
   - Use connection pooling properly

## 🔍 Debugging Tools

### Logging

**Enable detailed logging:**
```typescript
// In development
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'debug.log' })
  ]
});
```

### Database Debugging

**Enable query logging:**
```typescript
// Drizzle query logging
const db = drizzle(pool, {
  logger: true
});
```

### Network Debugging

**Check network requests:**
```bash
# Use curl for API testing
curl -X GET "http://localhost:8000/api/health" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

## 📞 Getting Help

### Community Support

1. **GitHub Issues:**
   - Check existing issues
   - Create detailed bug reports
   - Include reproduction steps

2. **Documentation:**
   - Review API documentation
   - Check deployment guides
   - Read troubleshooting guides

3. **Logs and Diagnostics:**
   - Include relevant log excerpts
   - Provide system information
   - Share configuration (without secrets)

### Professional Support

For enterprise support:
- Contact: support@adl-lms.com
- Business hours: Mon-Fri 9AM-6PM UTC
- Response time: < 24 hours

## 📋 Quick Reference

### Common Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm test               # Run tests
npm run lint           # Check code quality

# Database
npx drizzle-kit generate # Generate migrations
npx drizzle-kit push     # Apply migrations
npx drizzle-kit check    # Check migration status

# Docker
docker-compose up -d     # Start all services
docker-compose logs      # View logs
docker-compose down      # Stop services

# System
sudo systemctl status postgresql  # Check PostgreSQL
sudo systemctl status redis       # Check Redis
```

### Environment Variables Checklist

- [ ] `DATABASE_URL`
- [ ] `REDIS_URL`
- [ ] `JWT_SECRET`
- [ ] `GOOGLE_AI_API_KEY`
- [ ] `TAVILY_API_KEY`
- [ ] `SMTP_HOST`
- [ ] `SMTP_USER`
- [ ] `SMTP_PASS`
- [ ] `NODE_ENV`
- [ ] `PORT`

### Health Check Endpoints

- `GET /api/health` - Overall health
- `GET /api/health/database` - Database connectivity
- `GET /api/health/redis` - Redis connectivity

## 📝 Changelog

### v1.0.0
- Initial troubleshooting guide
- Common development issues
- Deployment troubleshooting
- Performance optimization tips
- Debugging tools and techniques