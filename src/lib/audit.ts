import { connectDB } from './db';
import { AuditLog } from '@/models/AuditLog';
import mongoose from 'mongoose';

export interface AuditParams {
  action: string;
  performedBy?: string | mongoose.Types.ObjectId;
  userId?: string | mongoose.Types.ObjectId;
  targetType?: string;
  resourceType?: string;
  targetId?: string | mongoose.Types.ObjectId;
  resourceId?: string | mongoose.Types.ObjectId;
  details?: Record<string, unknown>;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(params: AuditParams) {
  try {
    await connectDB();
    const performer = params.performedBy || params.userId;
    const target = params.targetType || params.resourceType || 'General';
    const targetId = params.targetId || params.resourceId || null;

    if (!performer) {
      console.warn('[AuditLog] Missing performedBy or userId, skipping audit log');
      return;
    }

    await AuditLog.create({
      action: params.action,
      performedBy: new mongoose.Types.ObjectId(performer.toString()),
      targetType: target,
      targetId: targetId ? new mongoose.Types.ObjectId(targetId.toString()) : null,
      details: {
        ...(params.details || {}),
        userEmail: params.userEmail,
        userRole: params.userRole,
      },
      ipAddress: params.ipAddress || '',
      userAgent: params.userAgent || '',
    });
  } catch (error) {
    console.error('[AuditLog Error] Failed to record audit log:', error);
  }
}
