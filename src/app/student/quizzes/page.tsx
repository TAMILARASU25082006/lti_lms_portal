import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Enrollment } from '@/models/Enrollment';
import { Quiz } from '@/models/Quiz';
import { QuizAttempt } from '@/models/QuizAttempt';
import DashboardHeader from '@/components/DashboardHeader';
import Link from 'next/link';
import { HelpCircle, Clock, Award, CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StudentQuizzesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const studentId = session.user.id;

  // 1. Get enrolled courses & batches
  const enrollments = await Enrollment.find({
    studentId,
    status: { $in: ['ACTIVE', 'COMPLETED'] },
  }).lean();

  const courseIds = enrollments.map((e) => e.courseId);
  const batchIds = enrollments.map((e) => e.batchId);

  // 2. Fetch available published quizzes
  const quizzes = await Quiz.find({
    $or: [{ courseId: { $in: courseIds } }, { batchId: { $in: batchIds } }],
    isPublished: true,
  })
    .populate('courseId', 'title')
    .sort({ createdAt: -1 })
    .lean();

  // 3. Fetch past attempts for each quiz
  const quizIds = quizzes.map((q) => q._id);
  const attempts = await QuizAttempt.find({
    quizId: { $in: quizIds },
    studentId,
    isCompleted: true,
  }).sort({ attemptNumber: -1 }).lean();

  const attemptsByQuiz: Record<string, any[]> = {};
  attempts.forEach((att) => {
    const qId = att.quizId.toString();
    if (!attemptsByQuiz[qId]) attemptsByQuiz[qId] = [];
    attemptsByQuiz[qId].push(att);
  });

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Quizzes & Concept Assessments"
        subtitle="Timed knowledge checks graded securely on the server. Passing scores contribute to certificate eligibility."
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
        {quizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz: any) => {
              const qId = quiz._id.toString();
              const userAttempts = attemptsByQuiz[qId] || [];
              const attemptsCount = userAttempts.length;
              const hasPassed = userAttempts.some((a) => a.isPassed);
              const bestScore = userAttempts.reduce((max, a) => (a.percentage > max ? a.percentage : max), 0);
              const canAttemptAgain = attemptsCount < quiz.maxAttempts;

              return (
                <div
                  key={qId}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700">
                        {quiz.courseId?.title || 'Cohort Quiz'}
                      </span>
                      {hasPassed ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Passed ({bestScore}%)</span>
                        </span>
                      ) : attemptsCount > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Best: {bestScore}%
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          Not Started
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-navy-950">{quiz.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{quiz.description || 'Cohort assessment'}</p>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>{quiz.timeLimitMinutes > 0 ? `${quiz.timeLimitMinutes} Mins` : 'Untimed'}</span>
                        </span>
                        <span>{quiz.questions?.length || 0} Questions</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>Passing Threshold: {quiz.passingScorePercent}%</span>
                        <span>
                          Attempts: {attemptsCount}/{quiz.maxAttempts}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    {canAttemptAgain ? (
                      <Link
                        href={`/student/quizzes/${qId}`}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs text-white bg-navy-900 hover:bg-blue-600 transition-colors shadow-sm"
                      >
                        <span>{attemptsCount > 0 ? 'Retake Quiz' : 'Start Assessment'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <div className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold text-center">
                        Max Attempts Reached
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
            No published quizzes available for your enrolled courses yet.
          </div>
        )}
      </div>
    </div>
  );
}
