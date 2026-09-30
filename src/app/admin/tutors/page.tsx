import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { TutorInvitation } from '@/models/TutorInvitation';
import { Course } from '@/models/Course';
import DashboardHeader from '@/components/DashboardHeader';
import TutorManagementClient from './TutorManagementClient';

export const dynamic = 'force-dynamic';

export default async function AdminTutorsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const adminUser = await User.findById(session.user.id);
  if (!adminUser || adminUser.role !== 'ADMIN') redirect('/unauthorized');

  const [tutors, invitations, courses] = await Promise.all([
    User.find({ role: 'TUTOR' }).sort({ createdAt: -1 }).lean(),
    TutorInvitation.find().populate('invitedBy', 'name').sort({ createdAt: -1 }).lean(),
    Course.find().select('title _id').lean(),
  ]);

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Tutor Faculty & Secure Invitations"
        subtitle="Authorize faculty access. Invitations require sign-in through a matching verified Google account."
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
        <TutorManagementClient
          initialTutors={JSON.parse(JSON.stringify(tutors))}
          initialInvitations={JSON.parse(JSON.stringify(invitations))}
          courses={JSON.parse(JSON.stringify(courses))}
        />
      </div>
    </div>
  );
}
