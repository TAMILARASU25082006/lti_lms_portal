import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import DashboardHeader from '@/components/DashboardHeader';
import ProfileForm from './ProfileForm';

export const dynamic = 'force-dynamic';

export default async function StudentProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user) redirect('/login');

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Student Profile & Settings"
        subtitle="Manage your academic identity and timezone preferences for live class scheduling."
      />

      <div className="p-6 sm:p-8 max-w-4xl mx-auto w-full">
        <ProfileForm user={JSON.parse(JSON.stringify(user))} />
      </div>
    </div>
  );
}
