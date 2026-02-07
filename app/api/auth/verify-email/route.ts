import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { hashToken } from '@/lib/auth';
import { withStrictRateLimit } from '@/lib/middleware/rateLimit';
import { logger } from '@/lib/utils/logger';
export const dynamic = 'force-dynamic';

const log = logger.child({ module: 'VerifyEmailRoute' });

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withStrictRateLimit(request, undefined, 10, '1 h');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Hash the token to match the stored hashed version
    const hashedToken = hashToken(token);

    // Find user by hashed verification token and check if token hasn't expired
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    return NextResponse.json(
      { message: 'Email verified successfully' },
      { status: 200 }
    );
  } catch (error) {
    log.error({ error }, 'Email verification error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
