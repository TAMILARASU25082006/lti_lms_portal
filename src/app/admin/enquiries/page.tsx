import React from 'react';
import { requireAdmin } from '@/lib/permissions';
import { connectDB } from '@/lib/db';
import { ContactEnquiry } from '@/models/ContactEnquiry';
import DashboardHeader from '@/components/DashboardHeader';
import AdminEnquiryClient from './AdminEnquiryClient';

export const metadata = {
  title: 'Admissions & Inquiries | Admin Portal',
};

export default async function AdminEnquiriesPage() {
  await requireAdmin();
  await connectDB();

  const enquiries = await ContactEnquiry.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const serialized = enquiries.map((e: any) => ({
    _id: e._id.toString(),
    name: e.name,
    email: e.email,
    phone: e.phone || '',
    subject: e.subject,
    courseInterest: e.courseInterest || '',
    message: e.message,
    status: e.status,
    adminNotes: e.adminNotes || '',
    createdAt: e.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Admissions & Contact Inquiries"
        subtitle="Review incoming course discovery queries, admissions requests, and track counselor follow-ups."
      />

      <AdminEnquiryClient initialEnquiries={serialized} />
    </div>
  );
}
