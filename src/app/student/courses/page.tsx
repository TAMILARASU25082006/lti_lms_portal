import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Enrollment } from '@/models/Enrollment';
import { Lesson } from '@/models/Lesson';
import { LessonProgress } from '@/models/LessonProgress';
import DashboardHeader from '@/components/DashboardHeader';
import Link from 'next/link';
import { BookOpen, Clock, Layers, ArrowRight, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function StudentCoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const studentId = session.user.id;

  const enrollments = await Enrollment.find({
    studentId,
    status: { $in: ['ACTIVE', 'COMPLETED'] },
  })
    .populate({
      path: 'courseId',
      populate: { path: 'primaryTutorId', select: 'name headline image' },
    })
    .populate({
      path: 'batchId',
      select: 'name code startDate endDate scheduleDescription',
    })
    .lean();

  const coursesWithMetrics = await Promise.all(
    enrollments.map(async (e: any) => {
      const course = e.courseId;
      if (!course) return null;
      const totalLessons = await Lesson.countDocuments({ courseId: course._id, isPublished: true });
      const completedCount = await LessonProgress.countDocuments({
        studentId,
        courseId: course._id,
        isCompleted: true,
      });
      const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      return {
        enrollmentId: e._id.toString(),
        course,
        batch: e.batchId,
        enrolledAt: e.enrolledAt,
        status: e.status,
        totalLessons,
        completedCount,
        progressPercent,
      };
    })
  );

  const activeCourses = coursesWithMetrics.filter(Boolean);

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="My Enrolled Courses"
        subtitle="Access your active technical curriculums, batch schedules, and classroom materials."
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
        {activeCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCourses.map((item: any) => (
              <div
                key={item.enrollmentId}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="h-36 bg-navy-950 p-5 text-white flex flex-col justify-between relative">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-600 text-white">
                        {item.course.category}
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {item.progressPercent}% Complete
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white line-clamp-2">{item.course.title}</h3>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-4">
                    {/* Batch metadata */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Cohort Batch:</span>
                        <span className="font-bold text-navy-950">{item.batch?.code || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Schedule:</span>
                        <span className="font-medium text-slate-700">{item.batch?.scheduleDescription || 'Flexible'}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{item.completedCount} of {item.totalLessons} Lessons</span>
                        <span>Enrolled {formatDate(item.enrolledAt)}</span>
                      </div>
                    </div>

                    {/* Tutor Profile */}
                    {item.course.primaryTutorId && (
                      <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-navy-900 flex items-center justify-center text-xs font-bold overflow-hidden">
                          {item.course.primaryTutorId.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.course.primaryTutorId.image}
                              alt={item.course.primaryTutorId.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            item.course.primaryTutorId.name?.[0] || 'T'
                          )}
                        </div>
                        <div className="text-xs">
                          <p className="font-semibold text-navy-900">{item.course.primaryTutorId.name}</p>
                          <p className="text-[10px] text-slate-400">Assigned Faculty</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  <Link
                    href={`/student/courses/${item.course._id}/classroom`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs text-white bg-navy-900 hover:bg-blue-600 transition-colors shadow-sm"
                  >
                    <span>Open Classroom</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-navy-950">No Enrolled Courses Found</h3>
            <p className="text-xs text-slate-500">
              When you are enrolled into a batch by administration, your course curriculum and live lessons will be
              accessible here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
