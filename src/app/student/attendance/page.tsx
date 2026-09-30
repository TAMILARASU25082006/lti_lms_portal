import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Attendance } from '@/models/Attendance';
import { Enrollment } from '@/models/Enrollment';
import { LiveSession } from '@/models/LiveSession';
import { User } from '@/models/User';
import DashboardHeader from '@/components/DashboardHeader';
import StatCard from '@/components/StatCard';
import { UserCheck, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function StudentAttendancePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const studentId = session.user.id;
  const user = await User.findById(studentId).lean();
  const timezone = user?.timezone || 'UTC';

  // 1. Get student's enrolled batches
  const enrollments = await Enrollment.find({
    studentId,
    status: { $in: ['ACTIVE', 'COMPLETED'] },
  }).lean();

  const batchIds = enrollments.map((e) => e.batchId);

  // 2. Fetch all completed sessions in these batches
  const totalCompletedSessions = await LiveSession.countDocuments({
    batchId: { $in: batchIds },
    status: 'COMPLETED',
  });

  // 3. Fetch student's attendance records
  const attendanceRecords = await Attendance.find({ studentId })
    .populate('liveSessionId', 'title scheduledStartTime meetingPlatform')
    .populate('batchId', 'code name')
    .sort({ createdAt: -1 })
    .lean();

  const presentCount = attendanceRecords.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const lateCount = attendanceRecords.filter((a) => a.status === 'LATE').length;
  const absentCount = attendanceRecords.filter((a) => a.status === 'ABSENT').length;

  const attendancePercent =
    totalCompletedSessions > 0 ? Math.round((presentCount / totalCompletedSessions) * 100) : 100;

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Live Class Attendance History"
        subtitle="Track your participation in scheduled live cohort masterclasses."
        userTimezone={timezone}
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
          <StatCard
            label="Attendance Rate"
            value={`${attendancePercent}%`}
            icon={UserCheck}
            color={attendancePercent >= 80 ? 'emerald' : 'amber'}
          />
          <StatCard
            label="Attended Sessions"
            value={presentCount}
            icon={CheckCircle2}
            color="blue"
          />
          <StatCard
            label="Late Logins"
            value={lateCount}
            icon={Clock}
            color="amber"
          />
          <StatCard
            label="Total Cohort Classes"
            value={totalCompletedSessions}
            icon={UserCheck}
            color="navy"
          />
        </div>

        {/* Notice on minimum certificate requirement */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              i
            </div>
            <p>
              Company Academy certificate criteria requires maintaining at least <span className="font-bold text-navy-950">80% live attendance</span> across assigned cohort sessions.
            </p>
          </div>
          <span className="font-bold text-blue-600 hidden sm:inline">
            Status: {attendancePercent >= 80 ? 'Eligible' : 'Needs Improvement'}
          </span>
        </div>

        {/* Attendance Records Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-navy-950">Session Records</h3>
            <span className="text-xs text-slate-500">{attendanceRecords.length} Logged Entries</span>
          </div>

          {attendanceRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Session Title</th>
                    <th className="px-6 py-3.5">Cohort Batch</th>
                    <th className="px-6 py-3.5">Date & Time</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Minutes Attended</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {attendanceRecords.map((rec: any) => (
                    <tr key={rec._id.toString()} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-semibold text-navy-950">
                        {rec.liveSessionId?.title || 'Live Masterclass'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold uppercase">
                          {rec.batchId?.code || 'Cohort'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDateTime(rec.liveSessionId?.scheduledStartTime, timezone)}
                      </td>
                      <td className="px-6 py-4">
                        {rec.status === 'PRESENT' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Present
                          </span>
                        ) : rec.status === 'LATE' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                            Late
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                            {rec.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium">
                        {rec.minutesAttended > 0 ? `${rec.minutesAttended} mins` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No live attendance logged yet. Attendance is marked by the instructor during or after each session.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
