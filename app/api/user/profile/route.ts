import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextAuth';
import { profileUpdateSchema } from '@/lib/validation/schemas';
import { withRateLimit } from '@/lib/middleware/rateLimit';
import { logger } from '@/lib/utils/logger';
export const dynamic = 'force-dynamic';

const log = logger.child({ module: 'ProfileRoute' });

export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request);
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

    // Get user
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          uid: user.uid,
          referralCode: user.referralCode,
          language: user.language,
          withdrawalAddress: user.withdrawalAddress,
          profilePicture: user.profilePicture,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    log.error({ error }, 'Get profile error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request);
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

    const body = await request.json();
    const validationResult = profileUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { fullName, language, withdrawalAddress, profilePicture } = validationResult.data;

    const updateData: Record<string, any> = {};
    if (fullName !== undefined && fullName) updateData.fullName = fullName;
    if (language !== undefined && language) updateData.language = language;
    if (withdrawalAddress !== undefined) updateData.withdrawalAddress = withdrawalAddress;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    // Update user
    const user = await User.findByIdAndUpdate(
      session.user.id,
      updateData,
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          uid: user.uid,
          referralCode: user.referralCode,
          language: user.language,
          withdrawalAddress: user.withdrawalAddress,
          profilePicture: user.profilePicture,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    log.error({ error }, 'Update profile error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
