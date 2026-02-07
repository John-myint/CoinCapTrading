import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import config from '@/lib/config';
export const dynamic = 'force-dynamic';

export async function GET() {
  const hasAuthSecret = !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET);
  const hasGoogleOAuth = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const hasMongoUri = !!process.env.MONGODB_URI;

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      auth: hasAuthSecret ? 'ok' : 'missing AUTH_SECRET',
      googleOAuth: hasGoogleOAuth ? 'configured' : 'not configured',
      rateLimit: config.rateLimit.enabled ? 'enabled' : 'disabled',
    },
    environment: process.env.NODE_ENV || 'development',
    envCheck: {
      AUTH_SECRET: hasAuthSecret,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      MONGODB_URI: hasMongoUri,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      SMTP_HOST: !!process.env.SMTP_HOST,
    },
  };

  try {
    await connectDB();
    health.services.database = 'ok';
  } catch (error) {
    health.status = 'degraded';
    health.services.database = 'error';
  }

  if (!hasAuthSecret) {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
