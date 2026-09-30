import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { connectDB } from '@/lib/db';
import { Course } from '@/models/Course';
import {
  GraduationCap,
  Users,
  Video,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getFeaturedCourses() {
  try {
    await connectDB();
    const courses = await Course.find({ status: 'PUBLISHED' })
      .populate('primaryTutorId', 'name image headline')
      .limit(3)
      .lean();
    return JSON.parse(JSON.stringify(courses));
  } catch (error) {
    console.error('Error fetching featured courses:', error);
    return [];
  }
}

export default async function HomePage() {
  const featuredCourses = await getFeaturedCourses();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden navy-gradient text-white py-20 lg:py-28">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/60 border border-blue-500/30 text-blue-300 text-xs font-semibold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Next Cohort Admissions Open</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Master Modern Engineering with <span className="text-blue-400">Cohort Mentorship</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-300 max-w-2xl leading-relaxed">
                Company Academy provides world-class technical curriculums combining live expert-led masterclasses,
                hands-on lab assignments, and official academy completion certifications.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-bold text-navy-950 bg-white hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl group"
                >
                  <span>Explore Course Catalogue</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md border border-blue-400/30"
                >
                  <span>Access Student Portal</span>
                </Link>
              </div>

              {/* Guarantees */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-navy-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Live & Recorded Hybrid</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Curated Small Batches</span>
                </div>
                <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Verified Credentials</span>
                </div>
              </div>
            </div>

            {/* Hero Graphic Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md bg-navy-900/90 rounded-2xl p-6 border border-blue-500/20 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-navy-800 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                      CA
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Live Cohort System</h3>
                      <p className="text-xs text-slate-400">Company Academy Portal</p>
                    </div>
                  </div>
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="bg-navy-950/80 rounded-xl p-3.5 border border-navy-800 flex items-center gap-3">
                    <Video className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-semibold text-white">Scheduled Live Sessions</p>
                      <p className="text-slate-400">Google Meet & Zoom deep-dives</p>
                    </div>
                  </div>

                  <div className="bg-navy-950/80 rounded-xl p-3.5 border border-navy-800 flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-semibold text-white">Syllabus & Code Repos</p>
                      <p className="text-slate-400">Persistent progress & video resume</p>
                    </div>
                  </div>

                  <div className="bg-navy-950/80 rounded-xl p-3.5 border border-navy-800 flex items-center gap-3">
                    <Award className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-semibold text-white">Academy Certifications</p>
                      <p className="text-slate-400">Cryptographically verifiable PDFs</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 p-3 rounded-lg bg-blue-950/60 border border-blue-800/40 text-center">
                  <p className="text-[11px] text-blue-200">
                    Students are directly enrolled into assigned batches by academy administration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Academy Stats Bar */}
      <section className="bg-white border-y border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-extrabold text-navy-950">100%</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Verified Mentors</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-navy-950">1:15</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Tutor-to-Student Ratio</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-navy-950">85%+</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Cohort Graduation Rate</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-navy-950">24/7</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Classroom Access</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Curated Curriculum</span>
            <h2 className="text-3xl font-bold text-navy-950 tracking-tight mt-1">Featured Programs</h2>
            <p className="text-slate-500 text-sm mt-2 max-w-xl">
              Explore our core engineering subjects. Each course is delivered in assigned cohorts with interactive live
              sessions and practical assignments.
            </p>
          </div>
          <Link
            href="/courses"
            className="mt-4 sm:mt-0 inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <span>View All Courses</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {featuredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredCourses.map((course: any) => (
              <div
                key={course._id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
              >
                <div className="h-44 bg-navy-900 relative flex items-center justify-center p-6 text-white overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-navy-950 via-navy-900 to-blue-700 opacity-90" />
                  <div className="relative z-10 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-blue-500/30 text-blue-200 border border-blue-400/30">
                      {course.category}
                    </span>
                    <h3 className="text-lg font-bold mt-2 text-white line-clamp-2">{course.title}</h3>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{course.durationWeeks} Weeks</span>
                      <span>{course.level}</span>
                      <span className="font-semibold text-blue-600">{course.deliveryMode.replace('_', ' ')}</span>
                    </div>

                    <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">{course.summary}</p>
                  </div>

                  <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Tutor</p>
                      <p className="text-xs font-bold text-navy-900">
                        {course.primaryTutorId?.name || 'Academy Faculty'}
                      </p>
                    </div>

                    <Link
                      href={`/courses/${course.slug}`}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-navy-900 hover:bg-blue-600 transition-colors"
                    >
                      View Syllabus
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-navy-900">Curriculums Initializing</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              Sample development courses will appear here after running the seed script or creating courses via the Admin
              portal.
            </p>
            <div className="mt-6">
              <Link
                href="/courses"
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800"
              >
                Browse Course Catalogue
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* How Cohort Learning Works */}
      <section className="bg-slate-100 py-16 lg:py-24 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Methodology</span>
            <h2 className="text-3xl font-bold text-navy-950 tracking-tight mt-1">How Cohort Learning Works</h2>
            <p className="text-slate-600 text-sm mt-2">
              Unlike generic video sites, Company Academy pairs students with designated tutors in scheduled batches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-4">
                01
              </div>
              <h3 className="text-base font-bold text-navy-950 mb-2">Direct Batch Enrolment</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tutors or administrators directly assign accepted students to designated cohorts with fixed start and
                end dates.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-4">
                02
              </div>
              <h3 className="text-base font-bold text-navy-950 mb-2">Live Masterclasses</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Attend scheduled Google Meet or Zoom sessions led by industry practitioners, complete with attendance
                logging.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-4">
                03
              </div>
              <h3 className="text-base font-bold text-navy-950 mb-2">Labs & Server-Graded Quizzes</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Submit assignments for tutor review and take timed quizzes with secure server-side evaluation.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-4">
                04
              </div>
              <h3 className="text-base font-bold text-navy-950 mb-2">Verified Certification</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Receive an official academy certificate with a unique verification code and public online validation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 navy-gradient text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Ready to Advance Your Career?</h2>
          <p className="text-slate-300 max-w-xl mx-auto text-base">
            Enrollments are arranged directly by Academy Administration. Inquire today for corporate batch scheduling
            or individual candidacy.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/contact"
              className="px-6 py-3.5 rounded-xl font-bold text-navy-950 bg-white hover:bg-slate-100 transition-all shadow-lg"
            >
              Contact Admissions
            </Link>
            <Link
              href="/courses"
              className="px-6 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all border border-blue-400/30"
            >
              Browse All Courses
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
