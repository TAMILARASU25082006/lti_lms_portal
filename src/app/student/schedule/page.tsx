import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Enrollment } from '@/models/Enrollment';
import { LiveSession } from '@/models/LiveSession';
import { User } from '@/models/User';
import DashboardHeader from '@/components/DashboardHeader';
import { Calendar, Video, Clock, ExternalLink, ShieldCheck, CheckCircle2, History } from 'lucide-react';
import { formatDateTime, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function StudentSchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const studentId = session.user.id;
  const user = await User.findById(studentId).lean();
  const timezone = user?.timezone || 'UTC';

  // 1. Get student's active batches
  const enrollments = await Enrollment.find({
    studentId,
    status: { $in: ['ACTIVE', 'COMPLETED'] },
  }).select('batchId');

  const batchIds = enrollments.map((e) => e.batchId).filter(Boolean);

  // 2. Fetch Live Sessions for these batches
  const sessions = await LiveSession.find({
    batchId: { $in: batchIds },
  })
    .populate('tutorId', 'name image headline')
    .populate('courseId', 'title slug')
    .populate('batchId', 'name code')
    .sort({ scheduledStartTime: 1 })
    .lean();

  const now = new Date();
  const upcomingSessions = sessions.filter((s) => new Date(s.scheduledEndTime || s.scheduledStartTime) >= now);
  const pastSessions = sessions.filter((s) => new Date(s.scheduledEndTime || s.scheduledStartTime) < now).reverse();

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Live Masterclass Schedule"
        subtitle="Live instructor-led cohorts. Times are displayed in your configured timezone."
        userTimezone={timezone}
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-10">
        {/* Policy notice */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-start gap-3.5">
          <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-slate-600">
            <p className="font-bold text-navy-950">Authorised Session Access</p>
            <p className="mt-0.5">
              Live meeting links (Google Meet / Zoom) are restricted to students currently enrolled in the designated cohort batch.
              Attendance is automatically logged by the instructor for certificate verification.
            </p>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-navy-950">Upcoming Live Sessions</h2>
          </div>

          {upcomingSessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingSessions.map((s: any) => {
                const isLive = s.status === 'LIVE';
                return (
                  <div
                    key={s._id.toString()}
                    className={`bg-white rounded-2xl border p-6 shadow-sm flex flex-col justify-between space-y-5 transition-all ${
                      isLive ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                          {s.batchId?.code || 'Cohort'}
                        </span>
                        {isLive ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500 text-white animate-pulse">
                            Live Now
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            {formatDate(s.scheduledStartTime, timezone)}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-navy-950 leading-snug">{s.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{s.description || 'Cohort live masterclass.'}</p>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-semibold text-navy-900">
                            {formatDateTime(s.scheduledStartTime, timezone)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Instructor: {s.tutorId?.name || 'Assigned Faculty'} ({s.tutorId?.headline || 'Faculty'})
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <a
                        href={s.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs shadow-sm transition-all ${
                          isLive
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-navy-900 hover:bg-blue-600 text-white'
                        }`}
                      >
                        <Video className="w-4 h-4" />
                        <span>Join via {s.meetingPlatform.replace('_', ' ')}</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              No upcoming live sessions scheduled for your cohort batches.
            </div>
          )}
        </div>

        {/* Past Sessions / Recordings */}
        {pastSessions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-bold text-navy-950">Past Sessions & Archive</h2>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
              {pastSessions.map((s: any) => (
                <div key={s._id.toString()} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-navy-950">{s.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold uppercase">
                        {s.batchId?.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Conducted on {formatDateTime(s.scheduledStartTime, timezone)} by {s.tutorId?.name || 'Tutor'}
                    </p>
                  </div>

                  {s.recordingUrl ? (
                    <a
                      href={s.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Watch Recording</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No recording uploaded</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
