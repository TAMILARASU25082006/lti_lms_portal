import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Course } from '@/models/Course';
import { User } from '@/models/User';
import DashboardHeader from '@/components/DashboardHeader';
import AdminCourseListClient from './AdminCourseListClient';

export const dynamic = 'force-dynamic';

export default async function AdminCoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const adminUser = await User.findById(session.user.id);
  if (!adminUser || adminUser.role !== 'ADMIN') redirect('/unauthorized');

  const [courses, tutors] = await Promise.all([
    Course.find().populate('primaryTutorId', 'name email').sort({ createdAt: -1 }).lean(),
    User.find({ role: 'TUTOR', status: 'ACTIVE' }).select('name email _id').lean(),
  ]);

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Curriculum Approvals & Course Management"
        subtitle="Review instructor submissions, approve publication, assign faculty, and manage program archives."
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
        <AdminCourseListClient
          initialCourses={JSON.parse(JSON.stringify(courses))}
          tutors={JSON.parse(JSON.stringify(tutors))}
        />
      </div>
    </div>
  );
}
