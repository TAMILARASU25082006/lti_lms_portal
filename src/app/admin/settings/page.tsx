import React from 'react';
import { requireAdmin } from '@/lib/permissions';
import { connectDB } from '@/lib/db';
import { AcademySettings } from '@/models/AcademySettings';
import DashboardHeader from '@/components/DashboardHeader';
import AdminSettingsClient from './AdminSettingsClient';

export const metadata = {
  title: 'Academy Settings & Branding | Admin Portal',
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  await connectDB();

  let settings: any = await AcademySettings.findOne().lean();
  if (!settings) {
    const created = await AcademySettings.create({
      companyName: 'Company Academy',
      tagline: 'Professional Academy for Career Excellence & Applied Technology',
      primaryColor: '#0f2744',
      secondaryColor: '#1d4ed8',
      accentColor: '#3b82f6',
      contactEmail: 'admissions@companyacademy.com',
      contactPhone: '+1 (555) 019-2834',
      address: '100 Technology Square, Suite 400, Cambridge, MA 02139',
      certificateSignatoryName: 'Dr. Evelyn Vance',
      certificateSignatoryTitle: 'Dean of Academic Governance',
      minAttendancePercentForCert: 80,
      minQuizScorePercentForCert: 70,
      requireAllAssignmentsPassed: true,
    });
    settings = JSON.parse(JSON.stringify(created));
  }

  const serialized = {
    companyName: settings?.companyName || 'Company Academy',
    tagline: settings?.tagline || 'Professional Academy for Career Excellence',
    logoUrl: settings?.logoUrl || '',
    faviconUrl: settings?.faviconUrl || '',
    primaryColor: settings?.primaryColor || '#0f2744',
    secondaryColor: settings?.secondaryColor || '#1d4ed8',
    accentColor: settings?.accentColor || '#3b82f6',
    contactEmail: settings?.contactEmail || 'admissions@companyacademy.com',
    contactPhone: settings?.contactPhone || '',
    address: settings?.address || '',
    certificateSignatoryName: settings?.certificateSignatoryName || 'Dr. Evelyn Vance',
    certificateSignatoryTitle: settings?.certificateSignatoryTitle || 'Dean of Academic Governance',
    minAttendancePercentForCert: settings?.minAttendancePercentForCert ?? 80,
    minQuizScorePercentForCert: settings?.minQuizScorePercentForCert ?? 70,
    requireAllAssignmentsPassed: settings?.requireAllAssignmentsPassed ?? true,
  };

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Academy Settings & Customization"
        subtitle="Configure branding colors, institution name, contact coordinates, and certificate qualification rules."
      />

      <AdminSettingsClient initialSettings={serialized} />
    </div>
  );
}
