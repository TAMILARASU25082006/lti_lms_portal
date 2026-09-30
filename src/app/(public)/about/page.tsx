import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, BookOpen, Users, Award, Target, Compass, Terminal } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Header */}
      <section className="bg-navy-950 text-white py-16 border-b border-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">About Company Academy</span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-2">
              Engineering Excellence Through Cohort Mentorship
            </h1>
            <p className="text-slate-300 text-base sm:text-lg mt-3 leading-relaxed">
              Founded on the belief that software engineering and cloud architecture cannot be mastered purely through
              passive video consumption. We combine live expert masterclasses, active code reviews, and structured cohort
              batches.
            </p>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-navy-950 mb-2">Dedicated Cohort Batches</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every student is assigned to a specific batch with designated tutors, a unified schedule, and an active
              peer community working through real-world milestones together.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
              <Terminal className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-navy-950 mb-2">Applied Engineering Labs</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Our assignments replicate real workplace repositories: production-grade architecture, code reviews,
              comprehensive rubrics, and direct feedback from lead tutors.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-navy-950 mb-2">Cryptographic Validation</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Academy completion certificates are issued only after verified attendance, completed assignments, and
              passing quiz metrics, verifiable online via unique identifiers.
            </p>
          </div>
        </div>

        {/* Academic Governance & Admissions Policy */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-navy-950">Academic Governance & Admissions</h2>
          </div>

          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>
              Company Academy maintains strict academic integrity. Course curriculums are curated and prepared by
              designated tutors, and must be rigorously reviewed and approved by Academy Administrators before publication.
            </p>
            <p>
              To maintain our high tutor-to-student standard, admissions are managed exclusively through corporate
              partnerships and direct academy enrollment. We do not support unverified self-registration or automated
              checkout flows.
            </p>
            <p>
              Certificates issued by Company Academy certify genuine academic completion of coursework, rigorous timed
              assessments, and live attendance standards as verified by the academic dean.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
