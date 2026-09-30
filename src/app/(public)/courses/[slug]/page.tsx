import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { connectDB } from '@/lib/db';
import { Course } from '@/models/Course';
import { Module } from '@/models/Module';
import { Lesson } from '@/models/Lesson';
import {
  CheckCircle,
  Clock,
  BookOpen,
  Calendar,
  Layers,
  Award,
  Video,
  FileText,
  ShieldCheck,
  ArrowRight,
  Info,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface CourseDetailPageProps {
  params: {
    slug: string;
  };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  await connectDB();

  const course = await Course.findOne({ slug: params.slug, status: 'PUBLISHED' })
    .populate('primaryTutorId', 'name headline bio image')
    .lean();

  if (!course) {
    notFound();
  }

  // Fetch modules and lessons
  const modules = await Module.find({ courseId: course._id, isPublished: true })
    .sort({ orderIndex: 1 })
    .lean();

  const moduleIds = modules.map((m) => m._id);
  const lessons = await Lesson.find({ moduleId: { $in: moduleIds }, isPublished: true })
    .sort({ orderIndex: 1 })
    .lean();

  // Group lessons by module
  const lessonsByModule: Record<string, any[]> = {};
  lessons.forEach((lesson) => {
    if (!lesson.moduleId) return;
    const mId = lesson.moduleId.toString();
    if (!lessonsByModule[mId]) lessonsByModule[mId] = [];
    lessonsByModule[mId].push(lesson);
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Hero Header */}
      <section className="bg-navy-950 text-white py-16 border-b border-navy-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600 text-white">
                {course.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-navy-900 text-slate-300 border border-navy-800">
                Level: {course.level}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                Mode: {course.deliveryMode.replace('_', ' ')}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {course.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl">
              {course.summary}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>{course.durationWeeks} Weeks Cohort ({course.estimatedHours} Total Hours)</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>{modules.length} Modules • {lessons.length} Lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-400" />
                <span>Official Academy Completion Certificate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Sidebar Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Details Column */}
          <div className="lg:col-span-8 space-y-10">
            {/* Overview / Description */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-navy-950">About This Program</h2>
              <div className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {course.description}
              </div>
            </div>

            {/* Learning Outcomes */}
            {course.learningOutcomes?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-5">
                <h2 className="text-xl font-bold text-navy-950">Target Learning Outcomes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.learningOutcomes.map((outcome: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 leading-snug">{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Curriculum / Syllabus Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-navy-950">Syllabus & Modules</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Structured modular progression. Text lessons, code repositories, and recorded video archives.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {lessons.length} Total Lessons
                </span>
              </div>

              {modules.length > 0 ? (
                <div className="space-y-4">
                  {modules.map((mod: any, index: number) => {
                    const modLessons = lessonsByModule[mod._id.toString()] || [];
                    return (
                      <div
                        key={mod._id.toString()}
                        className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden"
                      >
                        <div className="px-5 py-4 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                              Module {index + 1}
                            </span>
                            <h3 className="text-base font-bold text-navy-950 mt-0.5">{mod.title}</h3>
                          </div>
                          <span className="text-xs font-medium text-slate-500">
                            {modLessons.length} {modLessons.length === 1 ? 'Lesson' : 'Lessons'}
                          </span>
                        </div>

                        {modLessons.length > 0 && (
                          <div className="divide-y divide-slate-100">
                            {modLessons.map((l: any, lIdx: number) => (
                              <div
                                key={l._id.toString()}
                                className="px-5 py-3 flex items-center justify-between hover:bg-white transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {l.contentType === 'VIDEO' ? (
                                    <Video className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                  )}
                                  <span className="text-sm font-medium text-slate-700">
                                    {lIdx + 1}. {l.title}
                                  </span>
                                </div>
                                <span className="text-xs text-slate-400 capitalize">
                                  {l.contentType.toLowerCase()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Curriculum modules are being finalized for publication.</p>
              )}
            </div>

            {/* Prerequisites */}
            {course.prerequisites?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-4">
                <h2 className="text-xl font-bold text-navy-950">Prerequisites & Recommended Background</h2>
                <ul className="space-y-2">
                  {course.prerequisites.map((req: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Sidebar: Enrollment Notice & Tutor Profile */}
          <div className="lg:col-span-4 space-y-6">
            {/* Enrollment arranged card */}
            <div className="bg-white rounded-2xl border-2 border-blue-600/30 p-6 shadow-md space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Cohort-Based Learning</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-navy-950">How to Join This Program</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enrolment is arranged directly by Company Academy administration.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p>
                    Tutors or administrators directly assign enrolled students to designated batches with fixed live
                    class schedules.
                  </p>
                </div>
                <p className="text-[11px] text-slate-500">
                  There are no self-service checkout links or external transaction fees.
                </p>
              </div>

              <div className="space-y-2.5">
                <Link
                  href={`/contact?course=${encodeURIComponent(course.title)}`}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-sm"
                >
                  <span>Inquire for Upcoming Cohort</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/login"
                  className="w-full flex items-center justify-center px-5 py-3 rounded-xl font-semibold text-navy-950 bg-slate-100 hover:bg-slate-200 transition-colors text-sm"
                >
                  Already Enrolled? Sign In
                </Link>
              </div>
            </div>

            {/* Tutor Bio Card */}
            {course.primaryTutorId && (() => {
              const leadFaculty = course.primaryTutorId as any;
              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Lead Faculty</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-base overflow-hidden">
                      {leadFaculty.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={leadFaculty.image}
                          alt={leadFaculty.name || 'Faculty'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        leadFaculty.name?.[0] || 'T'
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-navy-950">{leadFaculty.name}</h4>
                      <p className="text-xs text-slate-500">{leadFaculty.headline || 'Senior Instructor'}</p>
                    </div>
                  </div>
                  {leadFaculty.bio && (
                    <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {leadFaculty.bio}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
