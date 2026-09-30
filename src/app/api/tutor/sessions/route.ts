import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Batch } from '@/models/Batch';
import { LiveSession } from '@/models/LiveSession';
import { Attendance } from '@/models/Attendance';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user || user.status === 'SUSPENDED' || (user.role !== 'TUTOR' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    // 1. Schedule Live Session
    if (action === 'SCHEDULE_SESSION') {
      const { batchId, courseId, title, description, meetingPlatform, meetingUrl, scheduledStartTime, scheduledEndTime } = body;

      if (!batchId || !courseId || !title || !meetingUrl || !scheduledStartTime || !scheduledEndTime) {
        return NextResponse.json({ error: 'Missing required session schedule fields' }, { status: 400 });
      }

      // Verify tutor is assigned to batch
      const batch = await Batch.findById(batchId);
      if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

      if (user.role === 'TUTOR') {
        const isAssigned = batch.assignedTutorIds?.some((id) => id.toString() === user._id.toString());
        if (!isAssigned) {
          return NextResponse.json({ error: 'You are not assigned to instruct this batch' }, { status: 403 });
        }
      }

      const liveSession = await LiveSession.create({
        batchId,
        courseId,
        tutorId: user._id,
        title,
        description: description || '',
        meetingPlatform: meetingPlatform || 'GOOGLE_MEET',
        meetingUrl,
        scheduledStartTime: new Date(scheduledStartTime),
        scheduledEndTime: new Date(scheduledEndTime),
        status: 'SCHEDULED',
      });

      return NextResponse.json({ success: true, liveSession });
    }

    // 2. Mark Attendance for a Live Session
    if (action === 'MARK_ATTENDANCE') {
      const { liveSessionId, records } = body;
      if (!liveSessionId || !Array.isArray(records)) {
        return NextResponse.json({ error: 'Invalid attendance payload' }, { status: 400 });
      }

      const liveSession = await LiveSession.findById(liveSessionId);
      if (!liveSession) return NextResponse.json({ error: 'Live session not found' }, { status: 404 });

      // Upsert attendance for each student in the batch
      const bulkOps = records.map((rec: any) => ({
        updateOne: {
          filter: { liveSessionId, studentId: rec.studentId },
          update: {
            $set: {
              batchId: liveSession.batchId,
              status: rec.status, // PRESENT, LATE, ABSENT, EXCUSED
              minutesAttended: rec.minutesAttended || 0,
              markedBy: user._id,
              notes: rec.notes || '',
            },
            $setOnInsert: {
              liveSessionId,
              studentId: rec.studentId,
            },
          },
          upsert: true,
        },
      }));

      await Attendance.bulkWrite(bulkOps);

      // Mark session completed if indicated
      if (body.markSessionCompleted) {
        liveSession.status = 'COMPLETED';
        liveSession.actualEndTime = new Date();
        await liveSession.save();
      }

      await AuditLog.create({
        action: 'ATTENDANCE_LOGGED',
        performedBy: user._id,
        targetType: 'LiveSession',
        targetId: liveSession._id,
        details: { sessionTitle: liveSession.title, studentCount: records.length },
      });

      return NextResponse.json({ success: true, message: 'Attendance recorded successfully.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Tutor Session API Error]:', error);
    return NextResponse.json({ error: 'Failed to process live session request' }, { status: 500 });
  }
}
