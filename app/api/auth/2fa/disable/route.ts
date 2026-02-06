import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import { auth } from '@/lib/nextAuth';
import { withStrictRateLimit } from '@/lib/middleware/rateLimit';
import { consumeBackupCode } from '@/lib/utils/twoFactor';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'TwoFADisableRoute' });

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

    const { password, code } = await request.json();

    if (!password && !code) {
      return NextResponse.json(
        { error: 'Password or 2FA code required to disable 2FA' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findById(session.user.id).select(
      '+password +twoFactorSecret +twoFactorBackupCodes'
    );

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

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA secret missing. Please re-enable 2FA.' },
        { status: 400 }
      );
    }

    // Verify using password (for email/password accounts) OR 2FA code (for OAuth accounts)
    let isVerified = false;

    if (password && user.password) {
      // Verify password
      isVerified = await bcrypt.compare(password, user.password);
      if (!isVerified) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        );
      }
    } else if (code) {
      // Verify 2FA code (for OAuth users or as alternative verification)
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: code,
        window: 6, // Increased window to allow ±3 minutes time difference
      });

      if (!verified) {
        const { matched, nextCodes } = consumeBackupCode(user.twoFactorBackupCodes, code);
        if (matched) {
          isVerified = true;
          user.twoFactorBackupCodes = nextCodes;
        }
      } else {
        isVerified = true;
      }

      if (!isVerified) {
        log.warn({ userId: user._id }, '2FA code verification failed');
        return NextResponse.json(
          { error: 'Invalid 2FA code. Please try a fresh code from your authenticator app.' },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Cannot verify: No password set for this account. Please provide your 2FA code instead.' },
        { status: 400 }
      );
    }

    // Disable 2FA
    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorBackupCodes = [];

    await user.save();

    log.info({ userId: user._id }, '2FA disabled successfully');

    return NextResponse.json(
      { message: '2FA disabled successfully' },
      { status: 200 }
    );
  } catch (error) {
    log.error({ error }, '2FA disable error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
