import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextAuth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user from database using userId from token
    const user = await User.findById(session.user.id).select(
      '+password fullName email uid referralCode isVerified isTwoFactorEnabled accountStatus language withdrawalAddress profilePicture createdAt'
    );

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
          isVerified: user.isVerified,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
          hasPassword: !!user.password, // Whether user has password set (OAuth vs email/password)
          accountStatus: user.accountStatus,
          language: user.language,
          withdrawalAddress: user.withdrawalAddress,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get user error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
