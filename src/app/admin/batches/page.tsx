import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Batch } from '@/models/Batch';
import { Course } from '@/models/Course';
import { User } from '@/models/User';
import { Enrollment } from '@/models/Enrollment';
import DashboardHeader from '@/components/DashboardHeader';
import AdminBatchConsole from './AdminBatchConsole';

export const dynamic = 'force-dynamic';

export default async function AdminBatchesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const adminUser = await User.findById(session.user.id);
  if (!adminUser || adminUser.role !== 'ADMIN') redirect('/unauthorized');

  const [batches, courses, tutors, enrollments] = await Promise.all([
    Batch.find()
      .populate('courseId', 'title')
      .populate('assignedTutorIds', 'name email')
      .sort({ createdAt: -1 })
      .lean(),
    Course.find().select('title _id').lean(),
    User.find({ role: 'TUTOR', status: 'ACTIVE' }).select('name email _id').lean(),
    Enrollment.find({ status: 'ACTIVE' })
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .populate('batchId', 'code name')
      .sort({ enrolledAt: -1 })
      .lean(),
  ]);

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Cohort Batches & Student Enrolments"
        subtitle="Create teaching cohorts, assign instructors, manage direct student enrollments and transfers."
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
        <AdminBatchConsole
          initialBatches={JSON.parse(JSON.stringify(batches))}
          courses={JSON.parse(JSON.stringify(courses))}
          tutors={JSON.parse(JSON.stringify(tutors))}
          initialEnrollments={JSON.parse(JSON.stringify(enrollments))}
        />
      </div>
    </div>
  );
}
