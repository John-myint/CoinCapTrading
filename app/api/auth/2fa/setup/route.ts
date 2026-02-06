import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { auth } from '@/lib/nextAuth';
import { withStrictRateLimit } from '@/lib/middleware/rateLimit';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'TwoFASetupRoute' });

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

    // Find user
    const user = await User.findById(session.user.id).select(
      '+twoFactorTempSecret +twoFactorTempSecretExpires'
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if 2FA is already enabled
    if (user.isTwoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is already enabled. Disable it first to set up again.' },
        { status: 400 }
      );
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `CoinCapTrading (${user.email})`,
      issuer: 'CoinCapTrading',
      length: 32,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    user.twoFactorTempSecret = secret.base32;
    user.twoFactorTempSecretExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    return NextResponse.json(
      {
        secret: secret.base32,
        qrCode,
        manualEntryKey: secret.base32,
        expiresInMinutes: 10,
      },
      { status: 200 }
    );
  } catch (error) {
    log.error({ error }, '2FA setup error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
