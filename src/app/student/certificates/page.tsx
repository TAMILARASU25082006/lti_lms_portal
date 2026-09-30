import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Certificate } from '@/models/Certificate';
import { Enrollment } from '@/models/Enrollment';
import { AcademySettings } from '@/models/AcademySettings';
import DashboardHeader from '@/components/DashboardHeader';
import CertificateViewList from './CertificateViewList';

export const dynamic = 'force-dynamic';

export default async function StudentCertificatesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const studentId = session.user.id;

  const [certificates, enrollments, settings] = await Promise.all([
    Certificate.find({ studentId }).sort({ issuedAt: -1 }).lean(),
    Enrollment.find({ studentId, status: { $in: ['ACTIVE', 'COMPLETED'] } })
      .populate('courseId', 'title slug')
      .populate('batchId', 'code name')
      .lean(),
    AcademySettings.findOne().lean(),
  ]);

  const academyName = settings?.companyName || 'Company Academy';
  const signatoryName = settings?.certificateSignatoryName || 'Dr. Arthur Vance, Ph.D.';
  const signatoryTitle = settings?.certificateSignatoryTitle || 'Dean of Academic Affairs';

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Official Completion Certificates"
        subtitle="Verifiable academy credentials awarded upon successful fulfillment of cohort requirements."
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
        <CertificateViewList
          certificates={JSON.parse(JSON.stringify(certificates))}
          enrollments={JSON.parse(JSON.stringify(enrollments))}
          academyName={academyName}
          signatoryName={signatoryName}
          signatoryTitle={signatoryTitle}
        />
      </div>
    </div>
  );
}
