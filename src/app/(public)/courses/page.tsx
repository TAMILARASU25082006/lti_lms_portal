import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { connectDB } from '@/lib/db';
import { Course } from '@/models/Course';
import { Search, Filter, BookOpen, Clock, Users, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface CoursesPageProps {
  searchParams: {
    q?: string;
    category?: string;
    level?: string;
    delivery?: string;
  };
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  await connectDB();

  const queryFilter: any = { status: 'PUBLISHED' };

  if (searchParams.q) {
    queryFilter.$or = [
      { title: { $regex: searchParams.q, $options: 'i' } },
      { summary: { $regex: searchParams.q, $options: 'i' } },
      { category: { $regex: searchParams.q, $options: 'i' } },
    ];
  }

  if (searchParams.category && searchParams.category !== 'All') {
    queryFilter.category = searchParams.category;
  }

  if (searchParams.level && searchParams.level !== 'All') {
    queryFilter.level = searchParams.level;
  }

  if (searchParams.delivery && searchParams.delivery !== 'All') {
    queryFilter.deliveryMode = searchParams.delivery;
  }

  const courses = await Course.find(queryFilter)
    .populate('primaryTutorId', 'name headline image')
    .sort({ createdAt: -1 })
    .lean();

  const categories = [
    'All',
    'Full-Stack Engineering',
    'Cloud & DevOps',
    'Data & AI',
    'Cyber Security',
    'Product & Architecture',
  ];

  const levels = ['All', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Catalog Header */}
      <section className="bg-navy-950 text-white py-14 border-b border-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Curriculum Directory</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">Explore Academy Programs</h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
              Curated, cohort-driven engineering courses. All curriculums feature live interactive masterclasses,
              text & video modules, rigorous homework assignments, and verified certificates.
            </p>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="bg-white border-b border-slate-200 py-6 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <form method="GET" action="/courses" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="q"
                  defaultValue={searchParams.q || ''}
                  placeholder="Search by keywords, technologies, or topics..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm text-navy-950"
                />
              </div>

              {/* Category Filter */}
              <select
                name="category"
                defaultValue={searchParams.category || 'All'}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? 'All Categories' : c}
                  </option>
                ))}
              </select>

              {/* Level Filter */}
              <select
                name="level"
                defaultValue={searchParams.level || 'All'}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {levels.map((l) => (
                  <option key={l} value={l}>
                    {l === 'All' ? 'All Levels' : l}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-navy-900 text-white font-semibold text-sm hover:bg-navy-800 transition-colors shadow-sm"
              >
                Filter
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Main Course Listing */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        {/* Enrollment Notice Banner */}
        <div className="mb-8 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              i
            </div>
            <p className="text-xs sm:text-sm">
              <span className="font-bold">Cohort Admissions Policy:</span> Student enrollment is arranged directly by
              Company Academy administration and cohort tutors. Self-checkout and payment gateways are intentionally not
              used.
            </p>
          </div>
          <Link
            href="/contact"
            className="text-xs font-bold text-blue-700 hover:text-blue-900 underline whitespace-nowrap"
          >
            Inquire for Batch Placement →
          </Link>
        </div>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course: any) => (
              <div
                key={course._id.toString()}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
              >
                {/* Header Banner */}
                <div className="h-44 bg-navy-900 relative p-6 text-white flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white">
                      {course.category}
                    </span>
                    <span className="text-xs font-semibold text-slate-300">{course.durationWeeks} Weeks</span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-blue-200 transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        {course.estimatedHours} hrs
                      </span>
                      <span>•</span>
                      <span className="capitalize">{course.level.toLowerCase()}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-medium">
                        {course.deliveryMode.replace('_', ' ').toLowerCase()}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {course.summary}
                    </p>
                  </div>

                  {/* Outcomes Preview */}
                  {course.learningOutcomes?.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Key Focus</p>
                      <p className="text-xs text-slate-700 line-clamp-2">
                        {course.learningOutcomes.slice(0, 2).join(' • ')}
                      </p>
                    </div>
                  )}

                  {/* Tutor info & Action */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-navy-900 flex items-center justify-center text-xs font-bold overflow-hidden">
                        {course.primaryTutorId?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={course.primaryTutorId.image}
                            alt={course.primaryTutorId.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          course.primaryTutorId?.name?.[0] || 'T'
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-navy-900">
                          {course.primaryTutorId?.name || 'Academy Faculty'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[110px]">
                          {course.primaryTutorId?.headline || 'Lead Instructor'}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/courses/${course.slug}`}
                      className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-navy-900 hover:bg-blue-600 transition-colors"
                    >
                      <span>Syllabus</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-navy-950">No courses match your query</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Try adjusting your search terms or clearing category filters to view available programs.
            </p>
            <div className="mt-5">
              <Link
                href="/courses"
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold text-white bg-navy-900"
              >
                Reset Filters
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
