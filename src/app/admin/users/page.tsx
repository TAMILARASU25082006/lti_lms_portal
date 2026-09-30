import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Enrollment } from '@/models/Enrollment';
import DashboardHeader from '@/components/DashboardHeader';
import AdminUserListClient from './AdminUserListClient';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const adminUser = await User.findById(session.user.id);
  if (!adminUser || adminUser.role !== 'ADMIN') redirect('/unauthorized');

  const users = await User.find().sort({ createdAt: -1 }).lean();

  // Get active enrollment counts for each user
  const usersWithMetrics = await Promise.all(
    users.map(async (u: any) => {
      const activeEnrollments = await Enrollment.countDocuments({ studentId: u._id, status: 'ACTIVE' });
      return {
        ...u,
        activeEnrollments,
      };
    })
  );

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Student & User Governance"
        subtitle="Manage registered Google authenticated accounts, active enrollments, and access suspension."
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
        <AdminUserListClient initialUsers={JSON.parse(JSON.stringify(usersWithMetrics))} />
      </div>
    </div>
  );
}
