import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { hashToken } from '@/lib/auth';
import { withStrictRateLimit } from '@/lib/middleware/rateLimit';
import { logger } from '@/lib/utils/logger';
import { resetPasswordSchema } from '@/lib/validation/schemas';
export const dynamic = 'force-dynamic';

const log = logger.child({ module: 'ResetPasswordRoute' });

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withStrictRateLimit(request, undefined, 5, '1 h');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    const body = await request.json();
    const validationResult = resetPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, password } = validationResult.data;

    // Hash the token to match the stored hashed version
    const hashedToken = hashToken(token);

    // Find user with matching hashed reset token
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Update password
    user.password = password;
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    log.info({ userId: user._id, email: user.email }, 'Password reset successfully');

    return NextResponse.json(
      { message: 'Password reset successfully. Please login with your new password.' },
      { status: 200 }
    );
  } catch (error) {
    log.error({ error }, 'Reset password error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
