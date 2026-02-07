import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextAuth';
import { withStrictRateLimit } from '@/lib/middleware/rateLimit';
import { logger } from '@/lib/utils/logger';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimitResponse = await withStrictRateLimit(request, undefined, 10, '1 h');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user from database
    const user = await User.findById(session.user.id).select('isTwoFactorEnabled +twoFactorBackupCodes');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.isTwoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is not enabled' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        hasBackupCodes: (user.twoFactorBackupCodes || []).length > 0,
        backupCodeCount: (user.twoFactorBackupCodes || []).length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error({ error }, 'Get backup codes error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
