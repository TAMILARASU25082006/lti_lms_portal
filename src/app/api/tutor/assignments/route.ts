import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Assignment } from '@/models/Assignment';
import { Course } from '@/models/Course';
import { Batch } from '@/models/Batch';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';

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

    const body = await req.json();
    const { courseId, batchId, scope, title, description, rubricCriteria, totalPoints, dueDate, allowLateSubmissions, latePenaltyPercentPerDay } = body;

    if (!courseId || !title || !description || !dueDate) {
      return NextResponse.json({ error: 'Missing required assignment fields' }, { status: 400 });
    }

    const course = await Course.findById(courseId);
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    if (user.role === 'TUTOR') {
      const isAssigned =
        course.primaryTutorId?.toString() === user._id.toString() ||
        course.assignedTutorIds?.some((id) => id.toString() === user._id.toString());
      if (!isAssigned) {
        return NextResponse.json({ error: 'You are not assigned to manage assignments for this course' }, { status: 403 });
      }
    }

    const assignment = await Assignment.create({
      courseId,
      batchId: scope === 'BATCH_SPECIFIC' ? batchId : null,
      scope: scope || 'COURSE_WIDE',
      title,
      description,
      rubricCriteria: rubricCriteria || '',
      totalPoints: Number(totalPoints) || 100,
      dueDate: new Date(dueDate),
      allowLateSubmissions: allowLateSubmissions !== false,
      latePenaltyPercentPerDay: Number(latePenaltyPercentPerDay) || 5,
      isPublished: true,
      createdBy: user._id,
    });

    await AuditLog.create({
      action: 'ASSIGNMENT_CREATED',
      performedBy: user._id,
      targetType: 'Assignment',
      targetId: assignment._id,
      details: { title: assignment.title, courseTitle: course.title, scope: assignment.scope },
    });

    return NextResponse.json({ success: true, assignment });
  } catch (error: any) {
    console.error('[Tutor Assignment Create Error]:', error);
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}
