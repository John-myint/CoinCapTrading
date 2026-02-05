if (!process.env.JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is required');
}

if (!process.env.MONGODB_URI) {
  throw new Error('CRITICAL: MONGODB_URI environment variable is required');
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('CRITICAL: NEXTAUTH_SECRET environment variable is required');
}

if (!process.env.NEXTAUTH_URL) {
  throw new Error('CRITICAL: NEXTAUTH_URL environment variable is required');
}

const config = {
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  nextAuth: {
    secret: process.env.NEXTAUTH_SECRET,
    url: process.env.NEXTAUTH_URL,
  },
  email: {
    from: process.env.EMAIL_FROM || 'noreply@coincaptrading.com',
    resendApiKey: process.env.RESEND_API_KEY,
  },
  app: {
    name: 'CoinCap Trading',
    defaultBalance: 10000,
    maxTradeAmount: 1000000,
  },
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    redis: {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    },
  },
} as const;

export default config;
