import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Quiz } from '@/models/Quiz';
import { Enrollment } from '@/models/Enrollment';
import QuizRunner from './QuizRunner';

interface QuizRunnerPageProps {
  params: {
    quizId: string;
  };
}

export default async function QuizRunnerPage({ params }: QuizRunnerPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const studentId = session.user.id;
  const quizId = params.quizId;

  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz || !quiz.isPublished) {
    notFound();
  }

  // Verify enrollment
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId: quiz.courseId,
    status: { $in: ['ACTIVE', 'COMPLETED'] },
  });

  if (!enrollment) {
    redirect('/student/quizzes?error=NotEnrolled');
  }

  return (
    <QuizRunner
      quizId={quizId}
      title={quiz.title}
      description={quiz.description || ''}
      timeLimitMinutes={quiz.timeLimitMinutes}
      passingScorePercent={quiz.passingScorePercent}
      maxAttempts={quiz.maxAttempts}
    />
  );
}
