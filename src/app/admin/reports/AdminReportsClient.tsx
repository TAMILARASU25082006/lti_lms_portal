'use client';

import React, { useState } from 'react';
import { Download, FileSpreadsheet, UserCheck, BookOpen, HelpCircle, CheckCircle2 } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

interface AdminReportsProps {
  attendance: any[];
  progressList: any[];
  attempts: any[];
  submissions: any[];
}

export default function AdminReportsClient({
  attendance,
  progressList,
  attempts,
  submissions,
}: AdminReportsProps) {
  const [activeReport, setActiveReport] = useState<'attendance' | 'progress' | 'assessments' | 'assignments'>('attendance');

  return (
    <div className="space-y-6">
      {/* Reports Selector & CSV Export Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveReport('attendance')}
            className={`px-3.5 py-2 rounded-xl transition-colors ${
              activeReport === 'attendance'
                ? 'bg-navy-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Live Attendance
          </button>
          <button
            onClick={() => setActiveReport('progress')}
            className={`px-3.5 py-2 rounded-xl transition-colors ${
              activeReport === 'progress'
                ? 'bg-navy-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Curriculum Progress
          </button>
          <button
            onClick={() => setActiveReport('assessments')}
            className={`px-3.5 py-2 rounded-xl transition-colors ${
              activeReport === 'assessments'
                ? 'bg-navy-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Quizzes & Assessments
          </button>
          <button
            onClick={() => setActiveReport('assignments')}
            className={`px-3.5 py-2 rounded-xl transition-colors ${
              activeReport === 'assignments'
                ? 'bg-navy-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Assignment Submissions
          </button>
        </div>

        <a
          href={`/api/admin/export?type=${activeReport}`}
          download
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-sm whitespace-nowrap self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Authorised CSV</span>
        </a>
      </div>

      {/* Report 1: Attendance */}
      {activeReport === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Session Title</th>
                  <th className="px-6 py-3.5">Cohort</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Minutes Attended</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attendance.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-navy-950">
                      <p>{r.studentId?.name || 'Student'}</p>
                      <p className="text-[11px] font-mono text-slate-400 font-normal">{r.studentId?.email}</p>
                    </td>
                    <td className="px-6 py-3.5 font-medium">{r.liveSessionId?.title || 'Live Session'}</td>
                    <td className="px-6 py-3.5 font-bold text-blue-600">{r.batchId?.code || '-'}</td>
                    <td className="px-6 py-3.5 text-slate-500">{formatDateTime(r.liveSessionId?.scheduledStartTime)}</td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono">{r.minutesAttended} mins</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 2: Progress */}
      {activeReport === 'progress' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Course</th>
                  <th className="px-6 py-3.5">Cohort</th>
                  <th className="px-6 py-3.5">Completed Lessons</th>
                  <th className="px-6 py-3.5">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {progressList.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-navy-950">
                      <p>{p.student?.name}</p>
                      <p className="text-[11px] font-mono text-slate-400 font-normal">{p.student?.email}</p>
                    </td>
                    <td className="px-6 py-3.5 font-medium">{p.course?.title}</td>
                    <td className="px-6 py-3.5 font-bold text-blue-600">{p.batch?.code}</td>
                    <td className="px-6 py-3.5">
                      {p.completed} of {p.total}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-navy-950">{p.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 3: Assessments */}
      {activeReport === 'assessments' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Quiz Title</th>
                  <th className="px-6 py-3.5">Cohort</th>
                  <th className="px-6 py-3.5">Attempt #</th>
                  <th className="px-6 py-3.5">Score</th>
                  <th className="px-6 py-3.5">Percentage</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attempts.map((att) => (
                  <tr key={att._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-navy-950">
                      <p>{att.studentId?.name}</p>
                      <p className="text-[11px] font-mono text-slate-400 font-normal">{att.studentId?.email}</p>
                    </td>
                    <td className="px-6 py-3.5 font-medium">{att.quizId?.title}</td>
                    <td className="px-6 py-3.5 font-bold text-blue-600">{att.batchId?.code}</td>
                    <td className="px-6 py-3.5 font-mono">#{att.attemptNumber}</td>
                    <td className="px-6 py-3.5 font-mono">
                      {att.score} / {att.totalPointsPossible}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-navy-950">{att.percentage}%</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          att.isPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {att.isPassed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 4: Assignments */}
      {activeReport === 'assignments' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Assignment</th>
                  <th className="px-6 py-3.5">Cohort</th>
                  <th className="px-6 py-3.5">Submitted</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Score</th>
                  <th className="px-6 py-3.5">Graded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {submissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-navy-950">
                      <p>{sub.studentId?.name}</p>
                      <p className="text-[11px] font-mono text-slate-400 font-normal">{sub.studentId?.email}</p>
                    </td>
                    <td className="px-6 py-3.5 font-medium">{sub.assignmentId?.title}</td>
                    <td className="px-6 py-3.5 font-bold text-blue-600">{sub.batchId?.code}</td>
                    <td className="px-6 py-3.5 text-slate-500">{formatDate(sub.submittedAt)}</td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-bold font-mono">
                      {sub.score !== null ? `${sub.score} / ${sub.assignmentId?.totalPoints}` : 'Pending'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{sub.gradedBy?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
