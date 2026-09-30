import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Course } from '@/models/Course';
import { Batch } from '@/models/Batch';
import { LiveSession } from '@/models/LiveSession';
import { Submission } from '@/models/Submission';
import { Assignment } from '@/models/Assignment';
import DashboardHeader from '@/components/DashboardHeader';
import StatCard from '@/components/StatCard';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  Calendar,
  FileCheck2,
  PlusCircle,
  Video,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function TutorDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const tutorId = session.user.id;

  // 1. Fetch Assigned Courses
  const coursesFilter =
    session.user.role === 'ADMIN'
      ? {}
      : {
          $or: [{ primaryTutorId: tutorId }, { assignedTutorIds: tutorId }],
        };

  const assignedCourses = await Course.find(coursesFilter).lean();
  const courseIds = assignedCourses.map((c) => c._id);

  // 2. Fetch Assigned Batches
  const batchesFilter =
    session.user.role === 'ADMIN'
      ? {}
      : {
          assignedTutorIds: tutorId,
        };

  const assignedBatches = await Batch.find(batchesFilter).populate('courseId', 'title').lean();
  const batchIds = assignedBatches.map((b) => b._id);

  // 3. Fetch Ungraded Submissions in assigned courses/batches
  const ungradedSubmissionsCount = await Submission.countDocuments({
    courseId: { $in: courseIds },
    status: 'SUBMITTED',
  });

  // 4. Upcoming scheduled live sessions
  const upcomingSessions = await LiveSession.find({
    batchId: { $in: batchIds },
    scheduledStartTime: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
  })
    .populate('batchId', 'code name')
    .sort({ scheduledStartTime: 1 })
    .limit(3)
    .lean();

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Tutor Teaching Workspace"
        subtitle={`Welcome, ${session.user.name || 'Instructor'}. Manage your assigned curriculums, cohorts, and grading.`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/tutor/courses"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 text-white font-semibold text-xs hover:bg-navy-800 transition-colors shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Curriculum Builder</span>
            </Link>
            <Link
              href="/tutor/batches"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500 transition-colors shadow-sm"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Manage Batches</span>
            </Link>
          </div>
        }
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
          <StatCard
            label="Assigned Courses"
            value={assignedCourses.length}
            icon={BookOpen}
            color="navy"
          />
          <StatCard
            label="Active Cohorts"
            value={assignedBatches.length}
            icon={Users}
            color="blue"
          />
          <StatCard
            label="Ungraded Work"
            value={ungradedSubmissionsCount}
            icon={FileCheck2}
            color={ungradedSubmissionsCount > 0 ? 'amber' : 'emerald'}
          />
          <StatCard
            label="Upcoming Sessions"
            value={upcomingSessions.length}
            icon={Calendar}
            color="purple"
          />
        </div>

        {/* Action Callout if ungraded work exists */}
        {ungradedSubmissionsCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                !
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  {ungradedSubmissionsCount} Pending Submissions Awaiting Evaluation
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Students have submitted labs and project solutions for your assigned courses.
                </p>
              </div>
            </div>
            <Link
              href="/tutor/assignments"
              className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-500 transition-colors shadow-sm whitespace-nowrap"
            >
              Review Submissions →
            </Link>
          </div>
        )}

        {/* Assigned Courses Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-950">Assigned Courses & Curriculum Status</h2>
            <Link href="/tutor/courses" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              View All Courses →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignedCourses.map((c: any) => (
              <div
                key={c._id.toString()}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {c.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : c.status === 'PENDING_APPROVAL'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-navy-950 leading-snug">{c.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{c.summary}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{c.durationWeeks} Weeks</span>
                  <Link
                    href={`/tutor/courses/${c._id}/builder`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    <span>Curriculum Builder</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assigned Batches Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-950">Cohort Batches & Scheduled Masterclasses</h2>
            <Link href="/tutor/batches" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              Manage Batches →
            </Link>
          </div>

          {assignedBatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignedBatches.map((b: any) => (
                <div
                  key={b._id.toString()}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                        {b.code}
                      </span>
                      <span className="text-xs text-slate-400">{b.status}</span>
                    </div>

                    <h3 className="text-base font-bold text-navy-950">{b.name}</h3>
                    <p className="text-xs text-slate-500">Course: {b.courseId?.title}</p>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      Schedule: <span className="font-semibold text-navy-950">{b.scheduleDescription || 'Flexible schedule'}</span>
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <Link
                      href={`/tutor/batches/${b._id}`}
                      className="w-full py-2.5 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition-colors text-center"
                    >
                      Open Batch Management (Classes, Attendance, Enrol)
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
              No batches currently assigned. Administration will assign you to student cohort cohorts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
