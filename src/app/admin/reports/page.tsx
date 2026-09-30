import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Attendance } from '@/models/Attendance';
import { Enrollment } from '@/models/Enrollment';
import { LessonProgress } from '@/models/LessonProgress';
import { Lesson } from '@/models/Lesson';
import { QuizAttempt } from '@/models/QuizAttempt';
import { Submission } from '@/models/Submission';
import DashboardHeader from '@/components/DashboardHeader';
import AdminReportsClient from './AdminReportsClient';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const adminUser = await User.findById(session.user.id);
  if (!adminUser || adminUser.role !== 'ADMIN') redirect('/unauthorized');

  // Fetch summaries for reports
  const [attendance, enrollments, attempts, submissions] = await Promise.all([
    Attendance.find()
      .populate('studentId', 'name email')
      .populate('liveSessionId', 'title scheduledStartTime')
      .populate('batchId', 'code')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean(),

    Enrollment.find({ status: 'ACTIVE' })
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .populate('batchId', 'code')
      .limit(30)
      .lean(),

    QuizAttempt.find({ isCompleted: true })
      .populate('studentId', 'name email')
      .populate('quizId', 'title')
      .populate('batchId', 'code')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean(),

    Submission.find()
      .populate('studentId', 'name email')
      .populate('assignmentId', 'title totalPoints')
      .populate('batchId', 'code')
      .populate('gradedBy', 'name')
      .sort({ submittedAt: -1 })
      .limit(30)
      .lean(),
  ]);

  // Compute progress percentages for enrollment sample
  const progressList = await Promise.all(
    enrollments.map(async (enr: any) => {
      const total = await Lesson.countDocuments({ courseId: enr.courseId?._id, isPublished: true });
      const completed = await LessonProgress.countDocuments({
        studentId: enr.studentId?._id,
        courseId: enr.courseId?._id,
        isCompleted: true,
      });
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        _id: enr._id.toString(),
        student: enr.studentId,
        course: enr.courseId,
        batch: enr.batchId,
        completed,
        total,
        percentage: pct,
      };
    })
  );

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Academic Performance & Compliance Reports"
        subtitle="Review cohort attendance rates, syllabus mastery, assessment attempts, and download authorised CSV exports."
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
        <AdminReportsClient
          attendance={JSON.parse(JSON.stringify(attendance))}
          progressList={JSON.parse(JSON.stringify(progressList))}
          attempts={JSON.parse(JSON.stringify(attempts))}
          submissions={JSON.parse(JSON.stringify(submissions))}
        />
      </div>
    </div>
  );
}
