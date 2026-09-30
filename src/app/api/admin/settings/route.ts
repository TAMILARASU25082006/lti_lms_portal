import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/permissions';
import { AcademySettings } from '@/models/AcademySettings';
import { logAuditEvent } from '@/lib/audit';

export async function GET() {
  try {
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

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get academy settings' },
      { status: error.message?.includes('Admin') ? 403 : 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const body = await req.json();

    let settings = await AcademySettings.findOne();
    if (!settings) {
      settings = new AcademySettings();
    }

    // Editable branding & operational parameters
    const allowedFields = [
      'companyName',
      'tagline',
      'logoUrl',
      'faviconUrl',
      'primaryColor',
      'secondaryColor',
      'accentColor',
      'contactEmail',
      'contactPhone',
      'address',
      'certificateSignatoryName',
      'certificateSignatoryTitle',
      'certificateOrganizationSealUrl',
      'minAttendancePercentForCert',
      'minQuizScorePercentForCert',
      'requireAllAssignmentsPassed',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (settings as any)[field] = body[field];
      }
    }

    settings.updatedBy = admin._id as any;
    await settings.save();

    await logAuditEvent({
      userId: admin._id.toString(),
      userEmail: admin.email,
      userRole: admin.role,
      action: 'UPDATE_ACADEMY_SETTINGS',
      resourceType: 'AcademySettings',
      resourceId: settings._id.toString(),
      details: {
        updatedFields: Object.keys(body).filter(k => allowedFields.includes(k)),
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update academy settings' },
      { status: error.message?.includes('Admin') ? 403 : 500 }
    );
  }
}
