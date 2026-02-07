import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextAuth';
import { withStrictRateLimit } from '@/lib/middleware/rateLimit';
import { generateBackupCodes, hashBackupCodes } from '@/lib/utils/twoFactor';
import { logger } from '@/lib/utils/logger';
export const dynamic = 'force-dynamic';

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

    // Require re-authentication: password or 2FA code
    const body = await request.json().catch(() => ({}));
    const { password, code } = body as { password?: string; code?: string };

    if (!password && !code) {
      return NextResponse.json(
        { error: 'Password or 2FA code required to regenerate backup codes' },
        { status: 400 }
      );
    }

    // Fetch user from database
    const userForAuth = await User.findById(session.user.id).select(
      '+password +twoFactorSecret'
    );

    if (!userForAuth) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!userForAuth.isTwoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is not enabled' },
        { status: 400 }
      );
    }

    // Verify identity
    let isVerified = false;
    if (password && userForAuth.password) {
      isVerified = await userForAuth.matchPassword(password);
    } else if (code && userForAuth.twoFactorSecret) {
      const speakeasy = (await import('speakeasy')).default;
      isVerified = speakeasy.totp.verify({
        secret: userForAuth.twoFactorSecret,
        encoding: 'base32',
        token: code,
        window: 2,
      });
    }

    if (!isVerified) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate new backup codes
    const newBackupCodes = generateBackupCodes(10);
    const hashedBackupCodes = hashBackupCodes(newBackupCodes);
    
    // Update user with new backup codes
    userForAuth.twoFactorBackupCodes = hashedBackupCodes;
    await userForAuth.save();

    log.info({ userId: userForAuth._id }, 'Backup codes regenerated successfully');

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
