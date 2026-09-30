import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Course } from '@/models/Course';
import { Quiz } from '@/models/Quiz';
import { QuizAttempt } from '@/models/QuizAttempt';
import DashboardHeader from '@/components/DashboardHeader';
import TutorQuizConsole from './TutorQuizConsole';

export const dynamic = 'force-dynamic';

export default async function TutorQuizzesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const tutorId = session.user.id;

  const coursesFilter =
    session.user.role === 'ADMIN'
      ? {}
      : {
          $or: [{ primaryTutorId: tutorId }, { assignedTutorIds: tutorId }],
        };

  const assignedCourses = await Course.find(coursesFilter).select('title _id').lean();
  const courseIds = assignedCourses.map((c) => c._id);

  const quizzes = await Quiz.find({ courseId: { $in: courseIds } })
    .populate('courseId', 'title')
    .sort({ createdAt: -1 })
    .lean();

  const quizIds = quizzes.map((q) => q._id);
  const attemptsCount = await QuizAttempt.countDocuments({ quizId: { $in: quizIds } });

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Cohort Assessment & Quiz Management"
        subtitle="Design timed technical evaluations with automated server-side grading and review policies."
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
        <TutorQuizConsole
          assignedCourses={JSON.parse(JSON.stringify(assignedCourses))}
          initialQuizzes={JSON.parse(JSON.stringify(quizzes))}
          totalAttemptsCount={attemptsCount}
        />
      </div>
    </div>
  );
}
