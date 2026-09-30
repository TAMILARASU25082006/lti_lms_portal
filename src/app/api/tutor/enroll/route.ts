import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Batch } from '@/models/Batch';
import { Course } from '@/models/Course';
import { Enrollment } from '@/models/Enrollment';
import { User } from '@/models/User';
import { Notification } from '@/models/Notification';
import { AuditLog } from '@/models/AuditLog';
import { z } from 'zod';

const EnrollSchema = z.object({
  batchId: z.string(),
  studentEmail: z.string().email(),
});

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
    const parsed = EnrollSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { batchId, studentEmail } = parsed.data;

    // 1. Verify batch exists and tutor is assigned (unless admin)
    const batch = await Batch.findById(batchId).populate('courseId');
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    if (user.role === 'TUTOR') {
      const isAssigned = batch.assignedTutorIds?.some((id) => id.toString() === user._id.toString());
      if (!isAssigned) {
        return NextResponse.json({ error: 'You are not assigned to manage enrolments for this cohort batch' }, { status: 403 });
      }
    }

    // 2. Find verified student account
    const student = await User.findOne({ email: studentEmail.toLowerCase() });
    if (!student) {
      return NextResponse.json({
        error: 'No registered user found with this email. Students must first sign in with Google to create their verified account.',
      }, { status: 404 });
    }

    if (student.status === 'SUSPENDED') {
      return NextResponse.json({ error: 'Cannot enroll suspended student account' }, { status: 400 });
    }

    // 3. Prevent duplicate enrollment in the same course
    const existingEnrollment = await Enrollment.findOne({
      studentId: student._id,
      courseId: batch.courseId._id,
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'ACTIVE') {
        return NextResponse.json({ error: 'Student is already actively enrolled in this course.' }, { status: 400 });
      }
      // Re-activate enrollment
      existingEnrollment.status = 'ACTIVE';
      existingEnrollment.batchId = batch._id;
      existingEnrollment.enrolledBy = user._id;
      await existingEnrollment.save();
    } else {
      await Enrollment.create({
        studentId: student._id,
        courseId: batch.courseId._id,
        batchId: batch._id,
        status: 'ACTIVE',
        enrolledBy: user._id,
      });
    }

    // Notify student
    await Notification.create({
      userId: student._id,
      title: 'Cohort Batch Enrolment',
      message: `You have been enrolled into batch "${batch.name}" (${batch.code}) for "${(batch.courseId as any).title}".`,
      type: 'ENROLLMENT',
      link: '/student/courses',
    });

    await AuditLog.create({
      action: 'STUDENT_ENROLLED_BY_TUTOR',
      performedBy: user._id,
      targetType: 'Enrollment',
      details: { studentEmail: student.email, batchCode: batch.code, courseTitle: (batch.courseId as any).title },
    });

    return NextResponse.json({
      success: true,
      message: `Student ${student.name} successfully enrolled in cohort ${batch.code}.`,
    });
  } catch (error: any) {
    console.error('[Tutor Enroll API Error]:', error);
    return NextResponse.json({ error: 'Failed to enrol student' }, { status: 500 });
  }
}
