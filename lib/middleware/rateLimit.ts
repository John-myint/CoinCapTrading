import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import config from '@/lib/config';
import { logger } from '@/lib/utils/logger';

// Singleton Redis instance - reused across all rate limit calls
let sharedRedis: Redis | null = null;

function getRedis(): Redis | null {
  if (sharedRedis) return sharedRedis;
  if (!config.rateLimit.enabled || !config.rateLimit.redis.url || !config.rateLimit.redis.token) {
    return null;
  }
  try {
    sharedRedis = new Redis({
      url: config.rateLimit.redis.url,
      token: config.rateLimit.redis.token,
    });
    return sharedRedis;
  } catch (error) {
    logger.warn('Rate limiting not configured, skipping rate limit checks');
    return null;
  }
}

// Singleton default rate limiter
let ratelimit: Ratelimit | null = null;

function getDefaultRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;
  const redis = getRedis();
  if (!redis) return null;
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: '@upstash/ratelimit',
  });
  return ratelimit;
}

// Cache for strict rate limiters keyed by maxRequests-window
const strictRatelimitCache = new Map<string, Ratelimit>();

function getStrictRatelimit(maxRequests: number, window: string): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  const cacheKey = `${maxRequests}-${window}`;
  let cached = strictRatelimitCache.get(cacheKey);
  if (cached) return cached;
  cached = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, window as any),
    analytics: true,
    prefix: '@upstash/ratelimit-strict',
  });
  strictRatelimitCache.set(cacheKey, cached);
  return cached;
}

function buildRateLimitResponse(
  status: number,
  message: string,
  limit: number,
  remaining: number,
  reset: number
): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests',
      message,
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    },
    {
      status,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(reset).toISOString(),
      },
    }
  );
}

export async function withRateLimit(
  request: NextRequest,
  identifier?: string
): Promise<NextResponse | null> {
  const rl = getDefaultRatelimit();
  if (!rl) return null;

  const id = identifier || request.ip || request.headers.get('x-forwarded-for') || 'anonymous';

  try {
    const { success, limit, reset, remaining } = await rl.limit(id);
    if (!success) {
      return buildRateLimitResponse(429, 'Please try again later', limit, remaining, reset);
    }
    return null;
  } catch (error) {
    logger.error({ error }, 'Rate limit check failed');
    return null;
  }
}

export async function withStrictRateLimit(
  request: NextRequest,
  identifier?: string,
  maxRequests: number = 5,
  window: string = '1 m'
): Promise<NextResponse | null> {
  const rl = getStrictRatelimit(maxRequests, window);
  if (!rl) return null;

  const id = identifier || request.ip || request.headers.get('x-forwarded-for') || 'anonymous';

  try {
    const { success, limit, reset, remaining } = await rl.limit(id);
    if (!success) {
      return buildRateLimitResponse(429, 'Rate limit exceeded. Please try again later.', limit, remaining, reset);
    }
    return null;
  } catch (error) {
    logger.error({ error }, 'Strict rate limit check failed');
    return null;
  }
}

export async function checkStrictRateLimit(
  identifier: string,
  maxRequests: number = 5,
  window: string = '1 m'
): Promise<{ success: boolean; retryAfter?: number }> {
  const rl = getStrictRatelimit(maxRequests, window);
  if (!rl) return { success: true };

  try {
    const { success, reset } = await rl.limit(identifier);
    if (success) {
      return { success: true };
    }
    return {
      success: false,
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    };
  } catch (error) {
    logger.error({ error }, 'Strict rate limit check failed');
    return { success: true };
  }
}
