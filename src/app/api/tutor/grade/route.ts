import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Submission } from '@/models/Submission';
import { Assignment } from '@/models/Assignment';
import { Notification } from '@/models/Notification';
import { AuditLog } from '@/models/AuditLog';
import { User } from '@/models/User';
import { z } from 'zod';

const GradeSchema = z.object({
  submissionId: z.string(),
  score: z.number().min(0),
  feedback: z.string().min(1, 'Feedback is required'),
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
    const parsed = GradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid grading fields', details: parsed.error.format() }, { status: 400 });
    }

    const { submissionId, score, feedback } = parsed.data;

    const submission = await Submission.findById(submissionId).populate('assignmentId');
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const assignment = submission.assignmentId as any;
    if (score > assignment.totalPoints) {
      return NextResponse.json({ error: `Score cannot exceed total points of ${assignment.totalPoints}` }, { status: 400 });
    }

    // Record grading history log
    submission.gradingHistory.push({
      score,
      feedback,
      gradedBy: user._id,
      gradedAt: new Date(),
    });

    submission.score = score;
    submission.feedback = feedback;
    submission.status = 'GRADED';
    submission.gradedBy = user._id;
    submission.gradedAt = new Date();
    await submission.save();

    // Notify student
    await Notification.create({
      userId: submission.studentId,
      title: 'Assignment Graded',
      message: `Your submission for "${assignment.title}" has been graded: ${score}/${assignment.totalPoints}.`,
      type: 'GRADE',
      link: '/student/assignments',
    });

    await AuditLog.create({
      action: 'ASSIGNMENT_GRADED',
      performedBy: user._id,
      targetType: 'Submission',
      targetId: submission._id,
      details: { assignmentTitle: assignment.title, studentId: submission.studentId, score },
    });

    return NextResponse.json({ success: true, message: 'Grade and feedback saved successfully.' });
  } catch (error: any) {
    console.error('[Tutor Grade API Error]:', error);
    return NextResponse.json({ error: 'Failed to record grade' }, { status: 500 });
  }
}
