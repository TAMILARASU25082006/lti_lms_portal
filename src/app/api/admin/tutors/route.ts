import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { TutorInvitation } from '@/models/TutorInvitation';
import { User } from '@/models/User';
import { Course } from '@/models/Course';
import { AuditLog } from '@/models/AuditLog';
import crypto from 'crypto';
import { z } from 'zod';

const InviteSchema = z.object({
  email: z.string().email(),
  assignedCourses: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const adminUser = await User.findById(session.user.id);
    if (!adminUser || adminUser.status === 'SUSPENDED' || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Requires Administrator privilege' }, { status: 403 });
    }

    const body = await req.json();

    if (body.action === 'REVOKE') {
      const { invitationId } = body;
      const invite = await TutorInvitation.findById(invitationId);
      if (!invite) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
      invite.status = 'REVOKED';
      await invite.save();

      await AuditLog.create({
        action: 'TUTOR_INVITATION_REVOKED',
        performedBy: adminUser._id,
        targetType: 'TutorInvitation',
        targetId: invite._id,
        details: { email: invite.email },
      });

      return NextResponse.json({ success: true, message: 'Invitation revoked' });
    }

    const parsed = InviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid invitation fields', details: parsed.error.format() }, { status: 400 });
    }

    const { email, assignedCourses, notes } = parsed.data;
    const lowerEmail = email.toLowerCase().trim();

    // Check if already an active tutor
    const existingTutor = await User.findOne({ email: lowerEmail, role: 'TUTOR' });
    if (existingTutor) {
      return NextResponse.json({ error: 'User is already an active tutor in the academy' }, { status: 400 });
    }

    // Check if there is already an active pending invitation
    const activeInvite = await TutorInvitation.findOne({
      email: lowerEmail,
      status: 'PENDING',
      expiresAt: { $gt: new Date() },
    });

    if (activeInvite) {
      return NextResponse.json({ error: 'An active invitation is already pending for this email address.' }, { status: 400 });
    }

    // Generate cryptographic token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await TutorInvitation.create({
      email: lowerEmail,
      token,
      invitedBy: adminUser._id,
      assignedCourses,
      status: 'PENDING',
      expiresAt,
      notes: notes || '',
    });

    await AuditLog.create({
      action: 'TUTOR_INVITATION_CREATED',
      performedBy: adminUser._id,
      targetType: 'TutorInvitation',
      targetId: invitation._id,
      details: { email: lowerEmail, assignedCourses },
    });

    return NextResponse.json({
      success: true,
      message: `Invitation generated for ${lowerEmail}. The recipient will be automatically promoted to Tutor upon signing in with their matching verified Google account.`,
      invitation,
    });
  } catch (error: any) {
    console.error('[Admin Tutor API Error]:', error);
    return NextResponse.json({ error: 'Failed to process tutor invitation' }, { status: 500 });
  }
}
