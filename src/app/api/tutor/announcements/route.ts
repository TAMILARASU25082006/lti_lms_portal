import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Announcement } from '@/models/Announcement';
import { Batch } from '@/models/Batch';
import { Enrollment } from '@/models/Enrollment';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user || user.status === 'SUSPENDED' || (user.role !== 'TUTOR' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { batchId, title, content, priority } = await req.json();

    if (!batchId || !title || !content) {
      return NextResponse.json({ error: 'batchId, title, and content are required' }, { status: 400 });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

    const announcement = await Announcement.create({
      batchId,
      courseId: batch.courseId,
      authorId: user._id,
      title,
      content,
      priority: priority || 'NORMAL',
    });

    // Notify all enrolled students in this batch
    const enrollments = await Enrollment.find({ batchId, status: 'ACTIVE' }).select('studentId');
    const notifs = enrollments.map((e) => ({
      userId: e.studentId,
      title: `Cohort Notice: ${title}`,
      message: content.slice(0, 140),
      type: 'ANNOUNCEMENT',
      link: '/student',
    }));

    if (notifs.length > 0) {
      await Notification.insertMany(notifs);
    }

    return NextResponse.json({ success: true, announcement });
  } catch (error: any) {
    console.error('[Tutor Announcement API Error]:', error);
    return NextResponse.json({ error: 'Failed to broadcast announcement' }, { status: 500 });
  }
}
