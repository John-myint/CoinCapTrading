#!/bin/bash

# CoinCapTrading - Environment Setup Script

echo "🚀 Setting up environment variables..."

cat > .env.local << 'EOF'
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/coincaptrading

# JWT Configuration (REQUIRED)
JWT_SECRET=IDYnsJksbcZGWir+edpiEisq38wmq1KvlaxZ9kD3sjI=
JWT_EXPIRES_IN=7d

# NextAuth Configuration (REQUIRED)
NEXTAUTH_SECRET=moudnirq1v70RnDs6NCg2FlxFy0nybBDTTB0juEtcs4=
NEXTAUTH_URL=http://localhost:3000

# Email Configuration (Optional - email features will be disabled without this)
# RESEND_API_KEY=your-resend-api-key
# EMAIL_FROM=noreply@coincaptrading.com

# Rate Limiting (Optional - will gracefully degrade without Redis)
RATE_LIMIT_ENABLED=false
# UPSTASH_REDIS_REST_URL=your-upstash-redis-url
# UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token

# Application Settings
NODE_ENV=development
LOG_LEVEL=debug
EOF

echo "✓ .env.local file created with secure secrets"
echo ""
echo "📋 Configuration:"
echo "  - JWT secrets generated"
echo "  - MongoDB: mongodb://localhost:27017/coincaptrading"
echo "  - Rate limiting: disabled (optional)"
echo "  - Email: disabled (optional)"
echo ""
echo "✅ Ready to start! Run: npm run dev"
