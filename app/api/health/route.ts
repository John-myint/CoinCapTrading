import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import config from '@/lib/config';
export const dynamic = 'force-dynamic';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      auth: 'ok',
      rateLimit: config.rateLimit.enabled ? 'enabled' : 'disabled',
    },
    environment: process.env.NODE_ENV || 'development',
  };

  try {
    await connectDB();
    health.services.database = 'ok';
  } catch (error) {
    health.status = 'degraded';
    health.services.database = 'error';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
