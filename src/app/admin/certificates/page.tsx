import React from 'react';
import { requireAdmin } from '@/lib/permissions';
import { connectDB } from '@/lib/db';
import { Certificate } from '@/models/Certificate';
import DashboardHeader from '@/components/DashboardHeader';
import AdminCertificatesClient from './AdminCertificatesClient';

export const metadata = {
  title: 'Certificates Registry | Admin Portal',
};

export default async function AdminCertificatesPage() {
  await requireAdmin();
  await connectDB();

  const certs = await Certificate.find()
    .populate('batchId', 'name')
    .sort({ issuedAt: -1 })
    .lean();

  const serialized = certs.map((c: any) => ({
    _id: c._id.toString(),
    certificateCode: c.certificateCode,
    studentName: c.studentName,
    courseTitle: c.courseTitle,
    batchName: c.batchId?.name || '',
    status: c.status,
    issuedAt: c.issuedAt.toISOString(),
    attendancePercent: c.attendancePercent,
    quizzesAveragePercent: c.quizzesAveragePercent,
    assignmentsCompletedCount: c.assignmentsCompletedCount,
    revocationReason: c.revocationReason,
    revokedAt: c.revokedAt ? c.revokedAt.toISOString() : undefined,
  }));

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Credential & Certificate Registry"
        subtitle="Monitor issued completion certificates, check eligibility audit histories, and enforce revocations."
      />

      <AdminCertificatesClient initialCertificates={serialized} />
    </div>
  );
}
