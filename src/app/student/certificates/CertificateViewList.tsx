'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
} from 'lucide-react';
import { generateCertificatePDF } from '@/lib/certificate-pdf';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface CertificateViewListProps {
  certificates: any[];
  enrollments: any[];
  academyName: string;
  signatoryName: string;
  signatoryTitle: string;
}

export default function CertificateViewList({
  certificates,
  enrollments,
  academyName,
  signatoryName,
  signatoryTitle,
}: CertificateViewListProps) {
  const router = useRouter();
  const [claimingCourseId, setClaimingCourseId] = useState<string | null>(null);
  const [claimStatus, setClaimStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const handleDownloadPDF = (cert: any) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://companyacademy.com';
    const verificationUrl = `${origin}/verify/${cert.certificateCode}`;

    const pdf = generateCertificatePDF({
      studentName: cert.studentName,
      courseTitle: cert.courseTitle,
      certificateCode: cert.certificateCode,
      issuedDateStr: formatDate(cert.issuedAt),
      academyName,
      signatoryName,
      signatoryTitle,
      verificationUrl,
    });

    pdf.save(`Certificate-${cert.certificateCode}.pdf`);
  };

  const handleClaimCertificate = async (courseId: string) => {
    setClaimingCourseId(courseId);
    setClaimStatus(null);

    try {
      const res = await fetch('/api/student/certificates/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim certificate');
      }

      setClaimStatus({
        type: 'success',
        message: data.message || 'Certificate successfully awarded!',
      });
      router.refresh();
    } catch (err: any) {
      setClaimStatus({
        type: 'error',
        message: err.message || 'Requirements not yet satisfied.',
      });
    } finally {
      setClaimingCourseId(null);
    }
  };

  // Find enrolled courses that don't have a certificate yet
  const certifiedCourseIds = new Set(certificates.map((c) => c.courseId.toString()));
  const eligibleCoursesToClaim = enrollments.filter((e) => e.courseId && !certifiedCourseIds.has(e.courseId._id.toString()));

  return (
    <div className="space-y-10">
      {/* Claim Status Notification */}
      {claimStatus && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 animate-in fade-in ${
            claimStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {claimStatus.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          )}
          <div>
            <p className="font-bold">{claimStatus.type === 'success' ? 'Credential Awarded' : 'Eligibility Notice'}</p>
            <p className="mt-0.5">{claimStatus.message}</p>
          </div>
        </div>
      )}

      {/* Issued Certificates Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-600" />
          <span>Issued Certificates ({certificates.length})</span>
        </h2>

        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert) => {
              const isRevoked = cert.status === 'REVOKED';
              return (
                <div
                  key={cert._id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                        {academyName}
                      </span>
                      {isRevoked ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Revoked
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Active & Verified</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Program Completed
                      </p>
                      <h3 className="text-xl font-bold text-navy-950 mt-0.5">{cert.courseTitle}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Certificate ID</span>
                        <span className="font-mono font-bold text-navy-900">{cert.certificateCode}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Issued On</span>
                        <span className="font-semibold text-slate-700">{formatDate(cert.issuedAt)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-slate-50">
                        <span className="text-[10px] text-slate-400 block">Attendance</span>
                        <span className="font-bold text-navy-950">{cert.attendancePercent}%</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50">
                        <span className="text-[10px] text-slate-400 block">Quizzes</span>
                        <span className="font-bold text-navy-950">{cert.quizzesAveragePercent}%</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50">
                        <span className="text-[10px] text-slate-400 block">Labs</span>
                        <span className="font-bold text-navy-950">{cert.assignmentsCompletedCount} Done</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleDownloadPDF(cert)}
                      className="flex-1 py-2.5 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>

                    <Link
                      href={`/verify/${cert.certificateCode}`}
                      target="_blank"
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Public Registry</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-xs text-slate-500">
            No certificates awarded yet. Complete your cohort coursework and assessments to become eligible.
          </div>
        )}
      </div>

      {/* Evaluate Ongoing Courses for Certificate Eligibility */}
      {eligibleCoursesToClaim.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Courses in Progress</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {eligibleCoursesToClaim.map((e) => (
              <div
                key={e._id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                    Cohort: {e.batchId?.code || 'Active'}
                  </span>
                  <h3 className="text-base font-bold text-navy-950">{e.courseId?.title}</h3>
                  <p className="text-xs text-slate-500">
                    Once all lessons are finished, quizzes passed, and 80%+ live attendance is verified, click below to
                    generate your certificate.
                  </p>
                </div>

                <button
                  onClick={() => handleClaimCertificate(e.courseId._id)}
                  disabled={claimingCourseId === e.courseId._id}
                  className="w-full py-2.5 rounded-xl border border-blue-600 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>
                    {claimingCourseId === e.courseId._id ? 'Verifying Criteria...' : 'Evaluate & Issue Certificate'}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
