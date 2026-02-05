# Quick Start Guide

## Prerequisites
- Node.js 18+
- MongoDB running locally or remote URI
- (Optional) Upstash Redis account for rate limiting

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
Create `.env.local` file with the following (copy from `env.example.txt`):

```env
# REQUIRED - Generate secure secrets
JWT_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/coincaptrading

# OPTIONAL - For rate limiting (highly recommended for production)
RATE_LIMIT_ENABLED=true
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# OPTIONAL - For email verification
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=noreply@yourdomain.com
```

### 3. Generate Secrets
```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate NEXTAUTH_SECRET  
openssl rand -base64 32
```

Copy the output and paste into your `.env.local` file.

### 4. Start Development Server
```bash
npm run dev
```

The app will start on http://localhost:3000

### 5. Verify Setup
Check the health endpoint:
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-xx-xxT...",
  "services": {
    "database": "ok",
    "auth": "ok",
    "rateLimit": "enabled"
  },
  "environment": "development"
}
```

## Optional: Set Up Upstash Redis (Recommended for Production)

### Why Rate Limiting is Important
Without rate limiting, your application is vulnerable to:
- Brute force attacks on login
- Registration spam
- API abuse
- Denial of Service (DoS) attacks

### Setup Steps
1. Sign up at https://upstash.com (free tier available)
2. Create a Redis database
3. Copy the REST URL and Token
4. Add to `.env.local`:
```env
RATE_LIMIT_ENABLED=true
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxYourTokenHerexxxZ
```

## Common Issues

### Issue: "JWT_SECRET environment variable is required"
**Solution:** Make sure `.env.local` exists and contains `JWT_SECRET=<your-secret>`

### Issue: "Please define the MONGODB_URI environment variable"
**Solution:** 
- For local: `MONGODB_URI=mongodb://localhost:27017/coincaptrading`
- For MongoDB Atlas: `MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/coincaptrading`

### Issue: Health check shows "database": "error"
**Solution:** 
- Make sure MongoDB is running
- Verify your MONGODB_URI is correct
- Check MongoDB connection logs

### Issue: Rate limiting not working
**Solution:** 
- Rate limiting is optional and will be disabled if Upstash is not configured
- Check that both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
- Verify credentials are correct in Upstash dashboard

## Production Deployment

### Before Deploying to Production:

1. **Generate new production secrets** (don't reuse development secrets)
```bash
openssl rand -base64 32  # New JWT_SECRET
openssl rand -base64 32  # New NEXTAUTH_SECRET
```

2. **Set up Upstash Redis** for rate limiting (critical for security)

3. **Configure MongoDB Atlas** or production MongoDB instance

4. **Set environment variables** in your deployment platform:
   - Vercel: Project Settings → Environment Variables
   - Railway: Project → Variables
   - Heroku: Settings → Config Vars

5. **Update NEXTAUTH_URL** to your production domain:
```env
NEXTAUTH_URL=https://yourdomain.com
```

6. **Review logs** after deployment:
```bash
# The application will log structured JSON in production
# Check for any startup errors
```

## Testing the Application

### 1. Register a new user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

### 2. Login (after email verification)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

### 3. Test rate limiting
Try logging in with wrong password 6 times rapidly - you should get rate limited after 5 attempts.

## Development Tips

### View logs in development
The application uses `pino` for logging with pretty printing in development:
```bash
npm run dev
# Logs will be colorful and formatted
```

### Check TypeScript types
```bash
npx tsc --noEmit
```

### Build for production
```bash
npm run build
```

## Getting Help

If you encounter issues:
1. Check `IMPROVEMENTS.md` for detailed information
2. Review `FIXED_SUMMARY.md` for comprehensive changes
3. Ensure all required environment variables are set
4. Check application logs for specific error messages

## Security Checklist for Production

- ✅ Unique, random JWT_SECRET generated
- ✅ Unique, random NEXTAUTH_SECRET generated  
- ✅ Rate limiting enabled with Upstash Redis
- ✅ HTTPS enabled (production domain)
- ✅ MongoDB using authentication
- ✅ Environment variables not committed to git
- ✅ Regular security updates (`npm audit`)

---

**Your application is now production-ready! 🚀**
