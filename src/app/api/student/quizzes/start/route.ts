import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Quiz } from '@/models/Quiz';
import { QuizAttempt } from '@/models/QuizAttempt';
import { Enrollment } from '@/models/Enrollment';
import { z } from 'zod';

const StartSchema = z.object({
  quizId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = StartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { quizId } = parsed.data;
    const studentId = session.user.id;

    await connectDB();

    const quiz = await Quiz.findById(quizId);
    if (!quiz || !quiz.isPublished) {
      return NextResponse.json({ error: 'Quiz not found or not published' }, { status: 404 });
    }

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId: quiz.courseId,
      status: { $in: ['ACTIVE', 'COMPLETED'] },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'You are not enrolled in the course for this assessment' }, { status: 403 });
    }

    // Check if there is an in-progress attempt (e.g. user refreshed the page)
    const activeAttempt = await QuizAttempt.findOne({
      quizId,
      studentId,
      isCompleted: false,
    });

    if (activeAttempt) {
      // Return existing attempt and its existing server deadline! Refreshing does not reset the timer!
      return NextResponse.json({
        success: true,
        attemptId: activeAttempt._id,
        attemptNumber: activeAttempt.attemptNumber,
        deadline: activeAttempt.deadline,
        questions: activeAttempt.questionSnapshot,
        timeLimitMinutes: quiz.timeLimitMinutes,
      });
    }

    // Check attempt limits
    const pastAttemptsCount = await QuizAttempt.countDocuments({
      quizId,
      studentId,
      isCompleted: true,
    });

    if (pastAttemptsCount >= quiz.maxAttempts) {
      return NextResponse.json({ error: `You have reached the maximum of ${quiz.maxAttempts} attempts for this quiz.` }, { status: 400 });
    }

    // Prepare immutable question snapshot WITHOUT correctOptionId or explanation!
    const sanitizedQuestions = quiz.questions.map((q) => ({
      questionId: q.questionId,
      prompt: q.prompt,
      options: q.options.map((opt) => ({ id: opt.id, text: opt.text })),
      points: q.points,
    }));

    // Server-enforced deadline
    const deadline =
      quiz.timeLimitMinutes > 0
        ? new Date(Date.now() + quiz.timeLimitMinutes * 60 * 1000)
        : undefined;

    const newAttempt = await QuizAttempt.create({
      quizId,
      quizVersion: quiz.version,
      studentId,
      courseId: quiz.courseId,
      batchId: enrollment.batchId,
      attemptNumber: pastAttemptsCount + 1,
      startedAt: new Date(),
      deadline,
      isCompleted: false,
      questionSnapshot: sanitizedQuestions,
      answers: [],
    });

    return NextResponse.json({
      success: true,
      attemptId: newAttempt._id,
      attemptNumber: newAttempt.attemptNumber,
      deadline: newAttempt.deadline,
      questions: sanitizedQuestions,
      timeLimitMinutes: quiz.timeLimitMinutes,
    });
  } catch (error: any) {
    console.error('[Quiz Start API Error]:', error);
    return NextResponse.json({ error: 'Failed to initiate assessment' }, { status: 500 });
  }
}
