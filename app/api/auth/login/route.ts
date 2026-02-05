import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { createToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { withStrictRateLimit } from '@/lib/middleware/rateLimit';
import { loginSchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'LoginRoute' });

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withStrictRateLimit(request, undefined, 5, '15 m');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    const body = await request.json();
    
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { email, password, token: twoFactorToken } = validationResult.data;

    const user = await User.findOne({ email })
      .select('+password +twoFactorSecret +twoFactorBackupCodes');

    if (!user) {
      log.warn({ email }, 'Login attempt with invalid email');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      log.warn({ email, userId: user._id }, 'Login attempt with invalid password');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: 'Please verify your email first' },
        { status: 403 }
      );
    }

    if (user.isTwoFactorEnabled) {
      if (!twoFactorToken) {
        return NextResponse.json(
          { error: 'Two-factor authentication required', requires2FA: true },
          { status: 403 }
        );
      }

      const speakeasy = require('speakeasy');
      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorToken,
        window: 2,
      });

      if (!isValid) {
        const isBackupCode = user.twoFactorBackupCodes?.includes(twoFactorToken);
        if (isBackupCode) {
          user.twoFactorBackupCodes = user.twoFactorBackupCodes.filter(
            (code: string) => code !== twoFactorToken
          );
          await user.save();
        } else {
          log.warn({ email, userId: user._id }, 'Invalid 2FA token');
          return NextResponse.json(
            { error: 'Invalid two-factor authentication code' },
            { status: 401 }
          );
        }
      }
    }

    const token = createToken(user._id.toString(), user.email);

    const response = NextResponse.json(
      {
        message: 'Logged in successfully',
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          uid: user.uid,
        },
        token,
      },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    log.info({ userId: user._id, email: user.email }, 'User logged in successfully');

    return response;
  } catch (error) {
    log.error({ error }, 'Login error');
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
