import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Notification } from '@/models/Notification';
import DashboardHeader from '@/components/DashboardHeader';
import { Bell, CheckCircle2, Award, Calendar, FileText, Info } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function StudentNotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const studentId = session.user.id;

  const notifications = await Notification.find({ userId: studentId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  // Mark all as read
  await Notification.updateMany({ userId: studentId, isRead: false }, { isRead: true, readAt: new Date() });

  const iconMap: Record<string, any> = {
    ENROLLMENT: CheckCircle2,
    ASSIGNMENT: FileText,
    GRADE: Award,
    LIVE_SESSION: Calendar,
    CERTIFICATE: Award,
    ANNOUNCEMENT: Bell,
    SYSTEM: Info,
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="In-App Notifications"
        subtitle="Recent activity alerts, live class reminders, assignment feedback, and updates."
      />

      <div className="p-6 sm:p-8 max-w-4xl mx-auto w-full">
        {notifications.length > 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
            {notifications.map((n: any) => {
              const Icon = iconMap[n.type] || Bell;
              return (
                <div key={n._id.toString()} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-navy-950">{n.title}</h4>
                      <span className="text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    {n.link && (
                      <Link
                        href={n.link}
                        className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        View Details →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No new notifications at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
