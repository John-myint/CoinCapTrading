import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { sendPasswordResetEmail } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';
import { generateSecureToken, hashToken } from '@/lib/auth';
import { withStrictRateLimit } from '@/lib/middleware/rateLimit';
import { logger } from '@/lib/utils/logger';
import { forgotPasswordSchema } from '@/lib/validation/schemas';
export const dynamic = 'force-dynamic';

const log = logger.child({ module: 'ForgotPasswordRoute' });

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withStrictRateLimit(request, undefined, 3, '1 h');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    const body = await request.json();
    const validationResult = forgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if email exists (security best practice)
      return NextResponse.json(
        { message: 'If an account with this email exists, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    // Generate secure reset token
    const resetToken = generateSecureToken();
    const hashedToken = hashToken(resetToken);
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetToken = hashedToken;
    user.resetTokenExpires = resetTokenExpires;
    await user.save();

    // Send password reset email in background — don't block response
    sendPasswordResetEmail(email, resetToken)
      .then((emailResult) => {
        if (!emailResult.success) {
          log.warn({ error: emailResult.error }, 'Failed to send password reset email');
        } else {
          log.info('Password reset email sent successfully');
        }
      })
      .catch((err) => log.warn({ error: err }, 'Password reset email threw unexpectedly'));

    return NextResponse.json(
      { message: 'If an account with this email exists, a password reset link has been sent.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
