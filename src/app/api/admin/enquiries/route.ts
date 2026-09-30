import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/permissions';
import { ContactEnquiry } from '@/models/ContactEnquiry';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const filter: Record<string, any> = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { courseInterest: { $regex: search, $options: 'i' } },
      ];
    }

    const enquiries = await ContactEnquiry.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, enquiries });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch enquiries' },
      { status: error.message?.includes('Admin') ? 403 : 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const body = await req.json();
    const { enquiryId, status, adminNotes } = body;

    if (!enquiryId) {
      return NextResponse.json({ error: 'enquiryId is required' }, { status: 400 });
    }

    const enquiry = await ContactEnquiry.findById(enquiryId);
    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    }

    if (status) {
      enquiry.status = status;
      if (status === 'RESPONDED') {
        enquiry.respondedBy = admin._id as any;
        enquiry.respondedAt = new Date();
      }
    }
    if (adminNotes !== undefined) {
      enquiry.adminNotes = adminNotes;
    }

    await enquiry.save();

    await logAuditEvent({
      userId: admin._id.toString(),
      userEmail: admin.email,
      userRole: admin.role,
      action: 'UPDATE_ENQUIRY',
      resourceType: 'ContactEnquiry',
      resourceId: enquiry._id.toString(),
      details: { status, adminNotesUpdated: adminNotes !== undefined },
    });

    return NextResponse.json({ success: true, enquiry });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update enquiry' },
      { status: error.message?.includes('Admin') ? 403 : 500 }
    );
  }
}
