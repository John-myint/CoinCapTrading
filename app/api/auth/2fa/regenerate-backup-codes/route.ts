import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextAuth';
import { withStrictRateLimit } from '@/lib/middleware/rateLimit';
import { generateBackupCodes, hashBackupCodes } from '@/lib/utils/twoFactor';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'TwoFARegenerateBackupCodesRoute' });

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withStrictRateLimit(request, undefined, 5, '1 h');
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
    const user = await User.findById(session.user.id);

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

    // Generate new backup codes
    const newBackupCodes = generateBackupCodes(10);
    const hashedBackupCodes = hashBackupCodes(newBackupCodes);
    
    // Update user with new backup codes
    user.twoFactorBackupCodes = hashedBackupCodes;
    await user.save();

    log.info({ userId: user._id }, 'Backup codes regenerated successfully');

    return NextResponse.json(
      {
        message: 'Backup codes regenerated successfully',
        backupCodes: newBackupCodes,
      },
      { status: 200 }
    );
  } catch (error: any) {
    log.error({ error }, 'Regenerate backup codes error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
