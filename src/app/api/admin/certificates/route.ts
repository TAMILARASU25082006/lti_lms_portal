import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/permissions';
import { Certificate } from '@/models/Certificate';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const filter: Record<string, any> = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { certificateCode: { $regex: search, $options: 'i' } },
        { studentName: { $regex: search, $options: 'i' } },
        { courseTitle: { $regex: search, $options: 'i' } },
      ];
    }

    const certificates = await Certificate.find(filter)
      .populate('studentId', 'name email')
      .populate('courseId', 'title slug')
      .populate('batchId', 'name code')
      .sort({ issuedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, certificates });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch certificates' },
      { status: error.message?.includes('Admin') ? 403 : 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const body = await req.json();
    const { certificateId, action, revocationReason } = body;

    if (!certificateId || !action) {
      return NextResponse.json({ error: 'certificateId and action are required' }, { status: 400 });
    }

    const cert = await Certificate.findById(certificateId);
    if (!cert) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    if (action === 'REVOKE') {
      if (!revocationReason || revocationReason.trim().length < 5) {
        return NextResponse.json(
          { error: 'A clear revocation reason (minimum 5 characters) is required' },
          { status: 400 }
        );
      }
      cert.status = 'REVOKED';
      cert.revokedAt = new Date();
      cert.revokedBy = admin._id as any;
      cert.revocationReason = revocationReason.trim();

      await cert.save();

      await logAuditEvent({
        userId: admin._id.toString(),
        userEmail: admin.email,
        userRole: admin.role,
        action: 'REVOKE_CERTIFICATE',
        resourceType: 'Certificate',
        resourceId: cert._id.toString(),
        details: {
          certificateCode: cert.certificateCode,
          studentName: cert.studentName,
          revocationReason,
        },
      });

      return NextResponse.json({ success: true, message: 'Certificate revoked', certificate: cert });
    } else if (action === 'REINSTATE') {
      cert.status = 'ACTIVE';
      cert.revokedAt = undefined;
      cert.revokedBy = undefined;
      cert.revocationReason = undefined;

      await cert.save();

      await logAuditEvent({
        userId: admin._id.toString(),
        userEmail: admin.email,
        userRole: admin.role,
        action: 'REINSTATE_CERTIFICATE',
        resourceType: 'Certificate',
        resourceId: cert._id.toString(),
        details: {
          certificateCode: cert.certificateCode,
          studentName: cert.studentName,
        },
      });

      return NextResponse.json({ success: true, message: 'Certificate reinstated', certificate: cert });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update certificate' },
      { status: error.message?.includes('Admin') ? 403 : 500 }
    );
  }
}
