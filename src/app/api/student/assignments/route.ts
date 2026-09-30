import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Enrollment } from '@/models/Enrollment';
import { Assignment } from '@/models/Assignment';
import { Submission } from '@/models/Submission';
import { Notification } from '@/models/Notification';
import { z } from 'zod';

const SubmitSchema = z.object({
  assignmentId: z.string(),
  submissionText: z.string().min(5, 'Submission text must be at least 5 characters'),
  fileUrls: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = SubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const { assignmentId, submissionText, fileUrls } = parsed.data;
    const studentId = session.user.id;

    await connectDB();

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment || !assignment.isPublished) {
      return NextResponse.json({ error: 'Assignment not found or unpublished' }, { status: 404 });
    }

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId: assignment.courseId,
      status: { $in: ['ACTIVE', 'COMPLETED'] },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'You are not enrolled in the course for this assignment' }, { status: 403 });
    }

    // If assignment is batch-specific, verify batch
    if (assignment.scope === 'BATCH_SPECIFIC' && assignment.batchId) {
      if (enrollment.batchId.toString() !== assignment.batchId.toString()) {
        return NextResponse.json({ error: 'Assignment is restricted to another batch' }, { status: 403 });
      }
    }

    const now = new Date();
    const isLate = now > new Date(assignment.dueDate);

    if (isLate && !assignment.allowLateSubmissions) {
      return NextResponse.json({ error: 'Late submissions are not permitted for this assignment' }, { status: 400 });
    }

    // Find previous attempts
    const existingSubmissions = await Submission.find({ assignmentId, studentId }).sort({ attemptNumber: -1 });
    const attemptNumber = existingSubmissions.length > 0 ? existingSubmissions[0].attemptNumber + 1 : 1;

    const submission = await Submission.create({
      assignmentId,
      studentId,
      courseId: assignment.courseId,
      batchId: enrollment.batchId,
      submittedAt: now,
      isLate,
      submissionText,
      fileUrls,
      status: 'SUBMITTED',
      attemptNumber,
    });

    // Notify instructor / tutors if assigned
    await Notification.create({
      userId: assignment.createdBy,
      title: 'New Student Submission',
      message: `${session.user.name || 'A student'} submitted assignment "${assignment.title}".`,
      type: 'ASSIGNMENT',
      link: '/tutor/assignments',
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment submitted successfully',
      submissionId: submission._id,
    });
  } catch (error: any) {
    console.error('[Assignment Submit API Error]:', error);
    return NextResponse.json({ error: 'Failed to submit assignment' }, { status: 500 });
  }
}
