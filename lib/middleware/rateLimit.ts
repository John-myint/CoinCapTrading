import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import config from '@/lib/config';
import { logger } from '@/lib/utils/logger';

let ratelimit: Ratelimit | null = null;

if (config.rateLimit.enabled && config.rateLimit.redis.url && config.rateLimit.redis.token) {
  try {
    const redis = new Redis({
      url: config.rateLimit.redis.url,
      token: config.rateLimit.redis.token,
    });

    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit',
    });
  } catch (error) {
    logger.warn('Rate limiting not configured, skipping rate limit checks');
  }
}

export async function withRateLimit(
  request: NextRequest,
  identifier?: string
): Promise<NextResponse | null> {
  if (!ratelimit) {
    return null;
  }

  const id = identifier || request.ip || request.headers.get('x-forwarded-for') || 'anonymous';

  try {
    const { success, limit, reset, remaining } = await ratelimit.limit(id);

    if (!success) {
      return NextResponse.json(
        { 
          error: 'Too many requests', 
          message: 'Please try again later',
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
          },
        }
      );
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
  if (!config.rateLimit.enabled || !config.rateLimit.redis.url || !config.rateLimit.redis.token) {
    return null;
  }

  const redis = new Redis({
    url: config.rateLimit.redis.url,
    token: config.rateLimit.redis.token,
  });

  const strictRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, window as any),
    analytics: true,
    prefix: '@upstash/ratelimit-strict',
  });

  const id = identifier || request.ip || request.headers.get('x-forwarded-for') || 'anonymous';

  try {
    const { success, limit, reset, remaining } = await strictRatelimit.limit(id);

    if (!success) {
      return NextResponse.json(
        { 
          error: 'Too many requests', 
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
          },
        }
      );
    }

    return null;
  } catch (error) {
    logger.error({ error }, 'Strict rate limit check failed');
    return null;
  }
}
