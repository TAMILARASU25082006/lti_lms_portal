import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { connectDB } from '@/lib/db';
import { Certificate } from '@/models/Certificate';
import { Award, CheckCircle2, XCircle, ShieldCheck, Calendar, BookOpen, UserCheck } from 'lucide-react';
import Link from 'next/link';

interface VerifyDetailPageProps {
  params: {
    certificateId: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function VerifyDetailPage({ params }: VerifyDetailPageProps) {
  await connectDB();

  const code = decodeURIComponent(params.certificateId).toUpperCase();

  // Search by certificateCode or ID
  const cert = await Certificate.findOne({
    $or: [{ certificateCode: code }, ...(code.length === 24 ? [{ _id: code }] : [])],
  }).lean();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <section className="bg-navy-950 text-white py-14 border-b border-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Credential Verification Service</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Official Academy Credential</h1>
        </div>
      </section>

      <main className="max-w-2xl mx-auto px-4 py-12 flex-1 w-full">
        {cert ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-lg space-y-8">
            {/* Status Banner */}
            {cert.status === 'ACTIVE' ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm">Verified Authentic Credential</p>
                  <p className="text-xs text-emerald-700">
                    This certificate is an authentic record issued by Company Academy.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-900">
                <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm">Certificate Revoked</p>
                  <p className="text-xs text-rose-700">
                    This certificate was revoked by academy administration ({cert.revocationReason || 'Administrative action'}).
                  </p>
                </div>
              </div>
            )}

            {/* Certificate Details */}
            <div className="space-y-6 border-b border-slate-100 pb-8">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recipient Name</span>
                <p className="text-2xl font-extrabold text-navy-950 mt-0.5">{cert.studentName}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Program Completed</span>
                <p className="text-lg font-bold text-blue-600 mt-0.5">{cert.courseTitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Certificate ID</span>
                  <p className="font-mono text-sm font-bold text-navy-900 mt-0.5">{cert.certificateCode}</p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Issue Date</span>
                  <p className="text-sm font-semibold text-navy-900 mt-0.5">
                    {new Date(cert.issuedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Verified Academic Criteria */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Verified Requirements Met
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs text-slate-500">Live Attendance</p>
                  <p className="text-base font-bold text-navy-950 mt-1">{cert.attendancePercent}%</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs text-slate-500">Quiz Average</p>
                  <p className="text-base font-bold text-navy-950 mt-1">{cert.quizzesAveragePercent}%</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs text-slate-500">Assignments</p>
                  <p className="text-base font-bold text-navy-950 mt-1">{cert.assignmentsCompletedCount} Completed</p>
                </div>
              </div>
            </div>

            {/* Academy Disclaimer */}
            <div className="p-4 rounded-xl bg-slate-50 text-[11px] text-slate-500 leading-relaxed">
              This official document is an academy-issued completion certificate certifying successful fulfillment of
              all cohort requirements under Company Academy. It does not represent external accreditation.
            </div>

            <div className="text-center pt-2">
              <Link href="/verify" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                ← Verify Another Certificate
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 shadow-sm text-center space-y-4">
            <XCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <h2 className="text-xl font-bold text-navy-950">Certificate Not Found</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              No certificate with code <span className="font-mono font-bold text-navy-900">{code}</span> could be
              located in the Company Academy registry.
            </p>
            <div className="pt-2">
              <Link
                href="/verify"
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-navy-900 hover:bg-navy-800"
              >
                Try Another Code
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
