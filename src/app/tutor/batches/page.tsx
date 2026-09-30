import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Batch } from '@/models/Batch';
import { Enrollment } from '@/models/Enrollment';
import DashboardHeader from '@/components/DashboardHeader';
import Link from 'next/link';
import { Users, Calendar, ArrowRight, Video, UserPlus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function TutorBatchesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const tutorId = session.user.id;

  const batchesFilter =
    session.user.role === 'ADMIN'
      ? {}
      : {
          assignedTutorIds: tutorId,
        };

  const batches = await Batch.find(batchesFilter)
    .populate('courseId', 'title slug')
    .sort({ startDate: -1 })
    .lean();

  const batchesWithCounts = await Promise.all(
    batches.map(async (b: any) => {
      const enrollmentCount = await Enrollment.countDocuments({ batchId: b._id, status: 'ACTIVE' });
      return {
        ...b,
        enrollmentCount,
      };
    })
  );

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Cohort Batches & Teaching Schedules"
        subtitle="Manage live class schedules, mark attendance, and enrol verified students into your assigned cohorts."
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {batchesWithCounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batchesWithCounts.map((b: any) => (
              <div
                key={b._id.toString()}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      {b.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 uppercase">{b.status}</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-navy-950">{b.name}</h3>
                    <p className="text-xs text-blue-600 font-medium mt-0.5">{b.courseId?.title}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Duration:</span>
                      <span>
                        {formatDate(b.startDate)} - {formatDate(b.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Active Students:</span>
                      <span className="font-bold text-navy-950">
                        {b.enrollmentCount} / {b.maxCapacity} Enrolled
                      </span>
                    </div>
                    <div className="pt-1 border-t border-slate-200/60">
                      <span className="text-slate-400 block text-[10px]">Schedule:</span>
                      <span className="font-semibold text-navy-950">{b.scheduleDescription || 'Flexible schedule'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/tutor/batches/${b._id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs text-white bg-navy-900 hover:bg-blue-600 transition-colors shadow-sm"
                  >
                    <span>Manage Cohort Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
            No cohort batches currently assigned to your tutor account.
          </div>
        )}
      </div>
    </div>
  );
}
