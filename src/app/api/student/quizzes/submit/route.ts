import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Quiz } from '@/models/Quiz';
import { QuizAttempt } from '@/models/QuizAttempt';
import { z } from 'zod';

const SubmitQuizSchema = z.object({
  attemptId: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedOptionId: z.string(),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = SubmitQuizSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid answers format' }, { status: 400 });
    }

    const { attemptId, answers } = parsed.data;
    const studentId = session.user.id;

    await connectDB();

    const attempt = await QuizAttempt.findOne({ _id: attemptId, studentId });
    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.isCompleted) {
      return NextResponse.json({ error: 'This assessment attempt has already been submitted.' }, { status: 400 });
    }

    const quiz = await Quiz.findById(attempt.quizId);
    if (!quiz) {
      return NextResponse.json({ error: 'Associated quiz no longer exists' }, { status: 404 });
    }

    // Build question map for instant grading
    const questionMap = new Map<string, any>();
    quiz.questions.forEach((q) => {
      questionMap.set(q.questionId, q);
    });

    let totalScore = 0;
    let totalPointsPossible = 0;

    const evaluatedAnswers = answers.map((ans) => {
      const q = questionMap.get(ans.questionId);
      if (!q) {
        return {
          questionId: ans.questionId,
          selectedOptionId: ans.selectedOptionId,
          isCorrect: false,
          pointsAwarded: 0,
        };
      }

      totalPointsPossible += q.points;
      const isCorrect = ans.selectedOptionId === q.correctOptionId;
      const pointsAwarded = isCorrect ? q.points : 0;
      totalScore += pointsAwarded;

      return {
        questionId: ans.questionId,
        selectedOptionId: ans.selectedOptionId,
        isCorrect,
        pointsAwarded,
      };
    });

    // Make sure we include all quiz points possible even if student skipped a question
    quiz.questions.forEach((q) => {
      const answered = answers.some((a) => a.questionId === q.questionId);
      if (!answered) {
        totalPointsPossible += q.points;
      }
    });

    const percentage = totalPointsPossible > 0 ? Math.round((totalScore / totalPointsPossible) * 100) : 0;
    const isPassed = percentage >= quiz.passingScorePercent;

    attempt.answers = evaluatedAnswers;
    attempt.score = totalScore;
    attempt.totalPointsPossible = totalPointsPossible;
    attempt.percentage = percentage;
    attempt.isPassed = isPassed;
    attempt.isCompleted = true;
    attempt.submittedAt = new Date();
    await attempt.save();

    // Prepare review payload if permitted
    const reviewPermitted = quiz.permitAnswerReview !== 'NEVER';
    let reviewDetails = null;

    if (reviewPermitted) {
      reviewDetails = quiz.questions.map((q) => ({
        questionId: q.questionId,
        prompt: q.prompt,
        correctOptionId: q.correctOptionId,
        explanation: q.explanation,
        studentSelectedOptionId: answers.find((a) => a.questionId === q.questionId)?.selectedOptionId || null,
        isCorrect: answers.find((a) => a.questionId === q.questionId)?.selectedOptionId === q.correctOptionId,
      }));
    }

    return NextResponse.json({
      success: true,
      score: totalScore,
      totalPointsPossible,
      percentage,
      isPassed,
      passingScorePercent: quiz.passingScorePercent,
      reviewPermitted,
      reviewDetails,
    });
  } catch (error: any) {
    console.error('[Quiz Submit API Error]:', error);
    return NextResponse.json({ error: 'Failed to process quiz grading' }, { status: 500 });
  }
}
