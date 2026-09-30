import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Course } from '@/models/Course';
import { Batch } from '@/models/Batch';
import { Enrollment } from '@/models/Enrollment';
import { Submission } from '@/models/Submission';
import { Certificate } from '@/models/Certificate';
import { ContactEnquiry } from '@/models/ContactEnquiry';
import { AuditLog } from '@/models/AuditLog';
import DashboardHeader from '@/components/DashboardHeader';
import StatCard from '@/components/StatCard';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  BookOpen,
  Layers,
  Award,
  MailQuestion,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();

  // 1. Real database counts
  const [
    studentsCount,
    tutorsCount,
    coursesCount,
    batchesCount,
    pendingCoursesCount,
    submissionsCount,
    certificatesCount,
    enquiriesCount,
  ] = await Promise.all([
    User.countDocuments({ role: 'STUDENT' }),
    User.countDocuments({ role: 'TUTOR' }),
    Course.countDocuments(),
    Batch.countDocuments(),
    Course.countDocuments({ status: 'PENDING_APPROVAL' }),
    Submission.countDocuments(),
    Certificate.countDocuments({ status: 'ACTIVE' }),
    ContactEnquiry.countDocuments({ status: 'NEW' }),
  ]);

  // 2. Fetch Recent Audit Logs
  const recentAuditLogs = await AuditLog.find()
    .populate('performedBy', 'name email role')
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Academy Governance & Administration"
        subtitle="Full operational oversight: students, faculty, approvals, cohort batches, and audit compliance."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/courses"
              className="px-3.5 py-2 rounded-xl bg-navy-900 text-white font-semibold text-xs hover:bg-navy-800 transition-colors shadow-sm"
            >
              + Create Course
            </Link>
            <Link
              href="/admin/batches"
              className="px-3.5 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500 transition-colors shadow-sm"
            >
              + Create Batch
            </Link>
          </div>
        }
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <StatCard
            label="Total Students"
            value={studentsCount}
            icon={Users}
            color="blue"
          />
          <StatCard
            label="Active Tutors"
            value={tutorsCount}
            icon={UserCheck}
            color="emerald"
          />
          <StatCard
            label="Curriculums"
            value={coursesCount}
            icon={BookOpen}
            color="navy"
          />
          <StatCard
            label="Cohort Batches"
            value={batchesCount}
            icon={Layers}
            color="purple"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <StatCard
            label="Pending Approvals"
            value={pendingCoursesCount}
            icon={AlertTriangle}
            color={pendingCoursesCount > 0 ? 'amber' : 'navy'}
          />
          <StatCard
            label="Work Submissions"
            value={submissionsCount}
            icon={FileSpreadsheet}
            color="blue"
          />
          <StatCard
            label="Active Certificates"
            value={certificatesCount}
            icon={Award}
            color="emerald"
          />
          <StatCard
            label="New Inquiries"
            value={enquiriesCount}
            icon={MailQuestion}
            color={enquiriesCount > 0 ? 'amber' : 'navy'}
          />
        </div>

        {/* Pending Courses Approval Alert */}
        {pendingCoursesCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                !
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  {pendingCoursesCount} Course Curriculums Awaiting Publication Approval
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Tutors have submitted modules and lessons for review. Review and publish to make courses discoverable.
                </p>
              </div>
            </div>
            <Link
              href="/admin/courses"
              className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-500 transition-colors shadow-sm whitespace-nowrap"
            >
              Review Courses →
            </Link>
          </div>
        )}

        {/* 2 Columns: Fast Shortcuts & Audit History */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Quick Management Shortcuts */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-navy-950">Administrative Shortcuts</h3>

            <div className="space-y-2.5">
              <Link
                href="/admin/tutors"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-colors group"
              >
                <div>
                  <p className="text-xs font-bold text-navy-950 group-hover:text-blue-600">Invite & Authorise Tutors</p>
                  <p className="text-[11px] text-slate-500">Send secure invitations redeemable via verified Google sign-in</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/users"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-colors group"
              >
                <div>
                  <p className="text-xs font-bold text-navy-950 group-hover:text-blue-600">Student & Account Governance</p>
                  <p className="text-[11px] text-slate-500">Manage student accounts, view enrollments, suspend accounts</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/batches"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-colors group"
              >
                <div>
                  <p className="text-xs font-bold text-navy-950 group-hover:text-blue-600">Cohort Enrolments & Transfers</p>
                  <p className="text-[11px] text-slate-500">Assign students to batches, transfer between cohorts, remove access</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/reports"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-colors group"
              >
                <div>
                  <p className="text-xs font-bold text-navy-950 group-hover:text-blue-600">Academic Reports & CSV Exports</p>
                  <p className="text-[11px] text-slate-500">Download attendance, progress, quiz, and assignment records</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/settings"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-colors group"
              >
                <div>
                  <p className="text-xs font-bold text-navy-950 group-hover:text-blue-600">Branding & Academy Settings</p>
                  <p className="text-[11px] text-slate-500">Company name, brand colors, certificate signatory rules</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Real-time Audit History Feed */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-navy-950">Recent Administrative Audit Trail</h3>
              <Link href="/admin/audit" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                View Full Log →
              </Link>
            </div>

            {recentAuditLogs.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {recentAuditLogs.map((log: any) => (
                  <div key={log._id.toString()} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy-950 font-mono text-[11px]">
                          {log.action}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          {log.targetType}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Performed by: <span className="font-semibold text-navy-900">{log.performedBy?.name || 'System / CLI'}</span>
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center">No audit log entries recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
