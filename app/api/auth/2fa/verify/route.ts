import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import { auth } from '@/lib/nextAuth';
import { withStrictRateLimit } from '@/lib/middleware/rateLimit';
import { generateBackupCodes, hashBackupCodes } from '@/lib/utils/twoFactor';
import { logger } from '@/lib/utils/logger';
export const dynamic = 'force-dynamic';

const log = logger.child({ module: 'TwoFAVerifyRoute' });

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

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Verification code required' },
        { status: 400 }
      );
    }

    // Find user and update 2FA settings
    const user = await User.findById(session.user.id).select(
      '+twoFactorTempSecret +twoFactorTempSecretExpires +twoFactorBackupCodes'
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.isTwoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is already enabled' },
        { status: 400 }
      );
    }

    if (!user.twoFactorTempSecret || !user.twoFactorTempSecretExpires) {
      return NextResponse.json(
        { error: 'No pending 2FA setup found. Please restart setup.' },
        { status: 400 }
      );
    }

    if (user.twoFactorTempSecretExpires.getTime() < Date.now()) {
      user.twoFactorTempSecret = null;
      user.twoFactorTempSecretExpires = null;
      await user.save();

      return NextResponse.json(
        { error: '2FA setup expired. Please restart setup.' },
        { status: 400 }
      );
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorTempSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = hashBackupCodes(backupCodes);

    // Save 2FA settings
    user.twoFactorSecret = user.twoFactorTempSecret;
    user.isTwoFactorEnabled = true;
    user.twoFactorBackupCodes = hashedBackupCodes;
    user.twoFactorTempSecret = null;
    user.twoFactorTempSecretExpires = null;

    await user.save();

    log.info({ userId: user._id }, '2FA enabled successfully');

    return NextResponse.json(
      {
        message: '2FA enabled successfully',
        backupCodes,
        warning: 'Save these backup codes in a safe place. You can use them to access your account if you lose access to your authenticator app.',
      },
      { status: 200 }
    );
  } catch (error) {
    log.error({ error }, '2FA verify error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
