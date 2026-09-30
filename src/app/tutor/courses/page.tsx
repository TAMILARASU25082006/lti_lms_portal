import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Course } from '@/models/Course';
import { Module } from '@/models/Module';
import { Lesson } from '@/models/Lesson';
import DashboardHeader from '@/components/DashboardHeader';
import Link from 'next/link';
import { BookOpen, Layers, Clock, ArrowRight, ShieldCheck, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TutorCoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const tutorId = session.user.id;

  const coursesFilter =
    session.user.role === 'ADMIN'
      ? {}
      : {
          $or: [{ primaryTutorId: tutorId }, { assignedTutorIds: tutorId }],
        };

  const courses = await Course.find(coursesFilter).sort({ createdAt: -1 }).lean();

  const coursesWithCounts = await Promise.all(
    courses.map(async (c: any) => {
      const moduleCount = await Module.countDocuments({ courseId: c._id });
      const lessonCount = await Lesson.countDocuments({ courseId: c._id });
      return {
        ...c,
        moduleCount,
        lessonCount,
      };
    })
  );

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Assigned Courses Directory"
        subtitle="Curate and structure curriculum modules and lessons for your assigned programs."
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Workflow reminder notice */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-start gap-3.5">
          <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-slate-600">
            <p className="font-bold text-navy-950">Curriculum Publication Workflow</p>
            <p className="mt-0.5">
              Tutors prepare curriculum content in draft status. When your modules, recorded lessons, and protected resources
              are ready, submit the course for Admin Publication Approval.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coursesWithCounts.map((course: any) => (
            <div
              key={course._id.toString()}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700">
                    {course.category}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      course.status === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : course.status === 'PENDING_APPROVAL'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {course.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-navy-950 leading-snug">{course.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{course.summary}</p>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>{course.moduleCount} Modules</span>
                  </span>
                  <span>•</span>
                  <span>{course.lessonCount} Lessons</span>
                  <span>•</span>
                  <span>{course.durationWeeks} Wks</span>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-slate-100 mt-2">
                <Link
                  href={`/tutor/courses/${course._id}/builder`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs text-white bg-navy-900 hover:bg-blue-600 transition-colors shadow-sm"
                >
                  <span>Open Curriculum Builder</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
