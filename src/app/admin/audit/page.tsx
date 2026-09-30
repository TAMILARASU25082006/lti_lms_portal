import React from 'react';
import { requireAdmin } from '@/lib/permissions';
import { connectDB } from '@/lib/db';
import { AuditLog } from '@/models/AuditLog';
import DashboardHeader from '@/components/DashboardHeader';
import AdminAuditClient from './AdminAuditClient';

export const metadata = {
  title: 'Audit Logs | Admin Portal',
};

export default async function AdminAuditPage() {
  await requireAdmin();
  await connectDB();

  const logs = await AuditLog.find()
    .populate('performedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(150)
    .lean();

  const serialized = logs.map((l: any) => ({
    _id: l._id.toString(),
    action: l.action,
    performerName: l.performedBy?.name || 'Administrator',
    performerEmail: l.performedBy?.email || 'admin@companyacademy.com',
    targetType: l.targetType,
    targetId: l.targetId ? l.targetId.toString() : undefined,
    details: l.details || {},
    ipAddress: l.ipAddress || '',
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="System & Administrative Audit History"
        subtitle="Complete chronological record of all high-privilege operations, publication approvals, enrolments, and policy edits."
      />

      <AdminAuditClient initialLogs={serialized} />
    </div>
  );
}
