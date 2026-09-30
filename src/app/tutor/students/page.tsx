import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Batch } from '@/models/Batch';
import { Enrollment } from '@/models/Enrollment';
import { LessonProgress } from '@/models/LessonProgress';
import { Lesson } from '@/models/Lesson';
import { Attendance } from '@/models/Attendance';
import { LiveSession } from '@/models/LiveSession';
import DashboardHeader from '@/components/DashboardHeader';
import { Users, BookOpen, UserCheck, Award } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function TutorStudentsPage() {
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

  const assignedBatches = await Batch.find(batchesFilter).select('_id code name courseId').lean();
  const batchIds = assignedBatches.map((b) => b._id);

  // Fetch enrollments in assigned batches
  const enrollments = await Enrollment.find({
    batchId: { $in: batchIds },
    status: 'ACTIVE',
  })
    .populate('studentId', 'name email image headline')
    .populate('courseId', 'title')
    .populate('batchId', 'code name')
    .sort({ enrolledAt: -1 })
    .lean();

  // Compute metrics per student
  const studentsWithMetrics = await Promise.all(
    enrollments.map(async (enr: any) => {
      const student = enr.studentId;
      if (!student) return null;

      const courseId = enr.courseId?._id;
      const totalLessons = await Lesson.countDocuments({ courseId, isPublished: true });
      const completedLessons = await LessonProgress.countDocuments({
        studentId: student._id,
        courseId,
        isCompleted: true,
      });
      const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      const totalSessions = await LiveSession.countDocuments({ batchId: enr.batchId?._id, status: 'COMPLETED' });
      const attendedCount = await Attendance.countDocuments({
        studentId: student._id,
        batchId: enr.batchId?._id,
        status: { $in: ['PRESENT', 'LATE'] },
      });
      const attendancePercent = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 100;

      return {
        enrollmentId: enr._id.toString(),
        student,
        course: enr.courseId,
        batch: enr.batchId,
        progressPercent,
        completedLessons,
        totalLessons,
        attendancePercent,
        enrolledAt: enr.enrolledAt,
      };
    })
  );

  const validStudents = studentsWithMetrics.filter(Boolean);

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Cohort Student Progress & Attendance"
        subtitle="Monitor academic advancement, completed modules, and live class attendance across your cohorts."
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-navy-950">Active Students Roster</h3>
            <span className="text-xs text-slate-500">{validStudents.length} Students</span>
          </div>

          {validStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Student</th>
                    <th className="px-6 py-3.5">Cohort Batch</th>
                    <th className="px-6 py-3.5">Course</th>
                    <th className="px-6 py-3.5">Curriculum Progress</th>
                    <th className="px-6 py-3.5">Live Attendance</th>
                    <th className="px-6 py-3.5">Enrolled Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {validStudents.map((item: any) => (
                    <tr key={item.enrollmentId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-navy-950 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-navy-900 flex items-center justify-center font-bold text-xs overflow-hidden">
                          {item.student.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.student.image} alt={item.student.name} className="w-full h-full object-cover" />
                          ) : (
                            item.student.name?.[0] || 'S'
                          )}
                        </div>
                        <div>
                          <p>{item.student.name}</p>
                          <p className="text-[11px] font-mono text-slate-400 font-normal">{item.student.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700">
                          {item.batch?.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-navy-950">{item.course?.title}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 max-w-[120px]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-navy-900">{item.progressPercent}%</span>
                            <span className="text-slate-400">
                              {item.completedLessons}/{item.totalLessons}
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${item.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            item.attendancePercent >= 80
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {item.attendancePercent}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(item.enrolledAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No students enrolled in your assigned cohorts yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
