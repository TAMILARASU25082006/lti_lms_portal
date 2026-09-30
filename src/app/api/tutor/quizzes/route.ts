import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Quiz } from '@/models/Quiz';
import { Course } from '@/models/Course';
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
    const { courseId, title, description, timeLimitMinutes, maxAttempts, passingScorePercent, permitAnswerReview, questions } = body;

    if (!courseId || !title || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Missing required quiz fields or questions' }, { status: 400 });
    }

    const course = await Course.findById(courseId);
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    if (user.role === 'TUTOR') {
      const isAssigned =
        course.primaryTutorId?.toString() === user._id.toString() ||
        course.assignedTutorIds?.some((id) => id.toString() === user._id.toString());
      if (!isAssigned) {
        return NextResponse.json({ error: 'You are not assigned to manage quizzes for this course' }, { status: 403 });
      }
    }

    const quiz = await Quiz.create({
      courseId,
      title,
      description: description || '',
      timeLimitMinutes: Number(timeLimitMinutes) || 15,
      maxAttempts: Number(maxAttempts) || 3,
      passingScorePercent: Number(passingScorePercent) || 70,
      permitAnswerReview: permitAnswerReview || 'AFTER_SUBMISSION',
      questions,
      isPublished: true,
      createdBy: user._id,
    });

    await AuditLog.create({
      action: 'QUIZ_CREATED',
      performedBy: user._id,
      targetType: 'Quiz',
      targetId: quiz._id,
      details: { title: quiz.title, courseTitle: course.title, questionCount: questions.length },
    });

    return NextResponse.json({ success: true, quiz });
  } catch (error: any) {
    console.error('[Tutor Quiz API Error]:', error);
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
  }
}
