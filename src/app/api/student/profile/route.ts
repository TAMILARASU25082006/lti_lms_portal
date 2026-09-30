import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { z } from 'zod';

const ProfileSchema = z.object({
  timezone: z.string().min(1),
  phone: z.string().optional(),
  bio: z.string().max(1000).optional(),
  headline: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          timezone: parsed.data.timezone,
          phone: parsed.data.phone || '',
          bio: parsed.data.bio || '',
          headline: parsed.data.headline || '',
        },
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Profile settings updated successfully',
      user: {
        timezone: user?.timezone,
        phone: user?.phone,
        bio: user?.bio,
        headline: user?.headline,
      },
    });
  } catch (error: any) {
    console.error('[Profile API Error]:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
