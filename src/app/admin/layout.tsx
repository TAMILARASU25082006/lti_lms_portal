import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SidebarNav from '@/components/SidebarNav';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/admin');
  }

  await connectDB();
  const user = await User.findById(session.user.id).select('status role');
  if (!user || user.status === 'SUSPENDED') {
    redirect('/suspended');
  }

  // Strict Admin Role Enforcement
  if (user.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100">
      <SidebarNav portal="admin" />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
