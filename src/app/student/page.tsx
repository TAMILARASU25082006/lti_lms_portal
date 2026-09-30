import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Enrollment } from '@/models/Enrollment';
import { LessonProgress } from '@/models/LessonProgress';
import { Lesson } from '@/models/Lesson';
import { LiveSession } from '@/models/LiveSession';
import { Assignment } from '@/models/Assignment';
import { Submission } from '@/models/Submission';
import { Announcement } from '@/models/Announcement';
import { Certificate } from '@/models/Certificate';
import { User } from '@/models/User';
import DashboardHeader from '@/components/DashboardHeader';
import StatCard from '@/components/StatCard';
import Link from 'next/link';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Video,
  FileCheck2,
  Clock,
  Award,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const studentId = session.user.id;
  const user = await User.findById(studentId).lean();
  const timezone = user?.timezone || 'UTC';

  // 1. Fetch active/completed enrollments
  const enrollments = await Enrollment.find({
    studentId,
    status: { $in: ['ACTIVE', 'COMPLETED'] },
  })
    .populate({
      path: 'courseId',
      select: 'title slug summary coverImage category durationWeeks',
    })
    .populate({
      path: 'batchId',
      select: 'name code scheduleDescription startDate endDate meetingPlatform defaultMeetingUrl',
    })
    .lean();

  // If no enrollments, show the clean empty state required by instructions
  if (!enrollments || enrollments.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <DashboardHeader
          title="Student Learning Space"
          subtitle={`Welcome, ${session.user.name || 'Student'}`}
          userTimezone={timezone}
        />

        <div className="p-6 sm:p-10 flex-1 flex flex-col items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 text-center shadow-sm space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <GraduationCap className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-navy-950">Awaiting Cohort Placement</h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Welcome to Company Academy. You currently have no active course enrollments.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p>
                  Cohort batches are directly assigned by Academy Administrators or your corporate program sponsor.
                </p>
              </div>
              <p className="text-[11px] text-slate-400">
                Once enrolled, your live schedules, classroom modules, assignments, and certificates will appear here.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href="/courses"
                className="flex-1 px-4 py-2.5 rounded-xl bg-navy-900 text-white font-semibold text-xs hover:bg-navy-800 transition-colors"
              >
                Browse Curriculums
              </Link>
              <Link
                href="/contact"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Inquire Admissions
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active student enrolled data gathering
  const courseIds = enrollments.map((e: any) => e.courseId?._id).filter(Boolean);
  const batchIds = enrollments.map((e: any) => e.batchId?._id).filter(Boolean);

  // Calculate course completion progress
  const courseProgressList = await Promise.all(
    enrollments.map(async (e: any) => {
      const course = e.courseId;
      if (!course) return null;
      const totalLessons = await Lesson.countDocuments({ courseId: course._id, isPublished: true });
      const completedLessons = await LessonProgress.countDocuments({
        studentId,
        courseId: course._id,
        isCompleted: true,
      });
      const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      return {
        enrollmentId: e._id.toString(),
        courseId: course._id.toString(),
        slug: course.slug,
        title: course.title,
        batchName: e.batchId?.name || 'Cohort Batch',
        batchCode: e.batchId?.code || '',
        completedLessons,
        totalLessons,
        percent,
      };
    })
  );

  const validProgress = courseProgressList.filter(Boolean);

  // Fetch upcoming live sessions
  const upcomingSessions = await LiveSession.find({
    batchId: { $in: batchIds },
    scheduledStartTime: { $gte: new Date(Date.now() - 30 * 60 * 1000) }, // include current active sessions
    status: { $in: ['SCHEDULED', 'LIVE'] },
  })
    .populate('tutorId', 'name')
    .sort({ scheduledStartTime: 1 })
    .limit(4)
    .lean();

  // Fetch pending assignments
  const assignments = await Assignment.find({
    $or: [{ courseId: { $in: courseIds }, scope: 'COURSE_WIDE' }, { batchId: { $in: batchIds } }],
    isPublished: true,
    dueDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  })
    .sort({ dueDate: 1 })
    .limit(5)
    .lean();

  const assignmentIds = assignments.map((a) => a._id);
  const submissions = await Submission.find({
    assignmentId: { $in: assignmentIds },
    studentId,
  }).lean();

  const submittedAssignmentMap = new Set(submissions.map((s) => s.assignmentId.toString()));

  // Pending assignments to show
  const pendingAssignments = assignments.map((a: any) => ({
    ...a,
    isSubmitted: submittedAssignmentMap.has(a._id.toString()),
  }));

  // Fetch announcements
  const announcements = await Announcement.find({
    $or: [{ batchId: { $in: batchIds } }, { courseId: { $in: courseIds } }],
  })
    .populate('authorId', 'name')
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();

  // Certificates earned
  const certificatesCount = await Certificate.countDocuments({ studentId, status: 'ACTIVE' });

  // Completed lessons sum
  const totalCompletedLessons = await LessonProgress.countDocuments({ studentId, isCompleted: true });

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Student Learning Space"
        subtitle={`Welcome back, ${session.user.name || 'Student'}`}
        userTimezone={timezone}
      />

      <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label="Enrolled Courses"
            value={enrollments.length}
            icon={BookOpen}
            color="blue"
          />
          <StatCard
            label="Lessons Completed"
            value={totalCompletedLessons}
            icon={FileCheck2}
            color="emerald"
          />
          <StatCard
            label="Live Sessions Ahead"
            value={upcomingSessions.length}
            icon={Calendar}
            color="navy"
          />
          <StatCard
            label="Certificates Earned"
            value={certificatesCount}
            icon={Award}
            color="purple"
          />
        </div>

        {/* Next Live Session Alert (If available) */}
        {upcomingSessions.length > 0 && (
          <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-blue-900 text-white rounded-2xl p-6 sm:p-7 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 border border-blue-500/20">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500 text-white">
                  Next Live Masterclass
                </span>
                {upcomingSessions[0].status === 'LIVE' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500 text-white animate-pulse">
                    Happening Now
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white">{upcomingSessions[0].title}</h3>
              <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>{formatDateTime(upcomingSessions[0].scheduledStartTime, timezone)}</span>
                <span>•</span>
                <span>Instructor: {(upcomingSessions[0] as any).tutorId?.name || 'Assigned Tutor'}</span>
              </p>
            </div>

            <a
              href={upcomingSessions[0].meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-navy-950 bg-white hover:bg-slate-100 transition-colors shadow-lg whitespace-nowrap text-sm"
            >
              <Video className="w-4 h-4 text-blue-600" />
              <span>Join Class via {upcomingSessions[0].meetingPlatform.replace('_', ' ')}</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1 text-slate-400" />
            </a>
          </div>
        )}

        {/* Enrolled Courses Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-950">Active Courses & Curriculums</h2>
            <Link href="/student/courses" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              View All Courses →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {validProgress.map((item: any) => (
              <div
                key={item.enrollmentId}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      {item.batchCode || 'Batch'}
                    </span>
                    <span className="text-xs font-bold text-navy-900">{item.percent}% Complete</span>
                  </div>

                  <h3 className="text-base font-bold text-navy-950 leading-snug line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500">Cohort: {item.batchName}</p>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {item.completedLessons} of {item.totalLessons} lessons marked complete
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/student/courses/${item.courseId}/classroom`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-navy-900 hover:bg-blue-600 transition-colors w-full justify-center"
                  >
                    <span>Enter Classroom</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2 Columns: Pending Assignments & Announcements */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Assignments Column */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-navy-950">Pending Assignments</h3>
              <Link href="/student/assignments" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                All Assignments
              </Link>
            </div>

            {pendingAssignments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {pendingAssignments.map((a: any) => (
                  <div key={a._id.toString()} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-navy-950">{a.title}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Due: {formatDate(a.dueDate, timezone)}</span>
                        <span>•</span>
                        <span>{a.totalPoints} Points</span>
                      </p>
                    </div>

                    <div>
                      {a.isSubmitted ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          Submitted
                        </span>
                      ) : (
                        <Link
                          href="/student/assignments"
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors whitespace-nowrap"
                        >
                          Submit Work
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No pending assignments due right now.</p>
            )}
          </div>

          {/* Announcements Column */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-navy-950">Cohort Announcements</h3>

            {announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.map((ann: any) => (
                  <div key={ann._id.toString()} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        {ann.priority} Priority
                      </span>
                      <span className="text-[10px] text-slate-400">{formatDate(ann.createdAt, timezone)}</span>
                    </div>
                    <h4 className="text-sm font-bold text-navy-950">{ann.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-3 whitespace-pre-line">{ann.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No cohort announcements posted.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
