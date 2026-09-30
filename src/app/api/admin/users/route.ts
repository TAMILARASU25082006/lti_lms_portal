import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';

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

    const { action, userId, status, role } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Prevent admin from suspending themselves
    if (action === 'TOGGLE_SUSPEND') {
      if (targetUser._id.toString() === adminUser._id.toString()) {
        return NextResponse.json({ error: 'Cannot suspend your own administrator account' }, { status: 400 });
      }

      const nextStatus = status || (targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
      targetUser.status = nextStatus;
      await targetUser.save();

      await AuditLog.create({
        action: nextStatus === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
        performedBy: adminUser._id,
        targetType: 'User',
        targetId: targetUser._id,
        details: { targetEmail: targetUser.email, targetRole: targetUser.role },
      });

      return NextResponse.json({
        success: true,
        message: `Account status updated to ${nextStatus}`,
        status: nextStatus,
      });
    }

    if (action === 'CHANGE_ROLE') {
      if (!['STUDENT', 'TUTOR', 'ADMIN'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
      }

      targetUser.role = role;
      await targetUser.save();

      await AuditLog.create({
        action: 'USER_ROLE_PROMOTED',
        performedBy: adminUser._id,
        targetType: 'User',
        targetId: targetUser._id,
        details: { targetEmail: targetUser.email, newRole: role },
      });

      return NextResponse.json({ success: true, message: `User role changed to ${role}`, role });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Admin User API Error]:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
