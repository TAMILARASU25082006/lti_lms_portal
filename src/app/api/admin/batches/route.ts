import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Batch } from '@/models/Batch';
import { Course } from '@/models/Course';
import { Enrollment } from '@/models/Enrollment';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import { Notification } from '@/models/Notification';

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
    const { action } = body;

    // 1. Create Batch
    if (action === 'CREATE_BATCH') {
      const {
        name,
        code,
        courseId,
        assignedTutorIds,
        startDate,
        endDate,
        scheduleDescription,
        maxCapacity,
        meetingPlatform,
        defaultMeetingUrl,
      } = body;

      if (!name || !code || !courseId || !startDate || !endDate) {
        return NextResponse.json({ error: 'Missing required batch fields' }, { status: 400 });
      }

      const existingCode = await Batch.findOne({ code: code.toUpperCase().trim() });
      if (existingCode) {
        return NextResponse.json({ error: 'Cohort code must be unique.' }, { status: 400 });
      }

      const batch = await Batch.create({
        name: name.trim(),
        code: code.toUpperCase().trim(),
        courseId,
        assignedTutorIds: assignedTutorIds || [],
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        scheduleDescription: scheduleDescription || '',
        maxCapacity: Number(maxCapacity) || 40,
        meetingPlatform: meetingPlatform || 'GOOGLE_MEET',
        defaultMeetingUrl: defaultMeetingUrl || '',
        status: 'UPCOMING',
        createdBy: adminUser._id,
      });

      await AuditLog.create({
        action: 'BATCH_CREATED',
        performedBy: adminUser._id,
        targetType: 'Batch',
        targetId: batch._id,
        details: { name: batch.name, code: batch.code },
      });

      return NextResponse.json({ success: true, batch });
    }

    // 2. Enrol Student
    if (action === 'ENROLL_STUDENT') {
      const { batchId, studentEmail } = body;
      const batch = await Batch.findById(batchId).populate('courseId');
      if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

      const student = await User.findOne({ email: studentEmail.toLowerCase().trim() });
      if (!student) {
        return NextResponse.json({
          error: 'No registered user found with this email. Students must first sign in with Google.',
        }, { status: 404 });
      }

      const existing = await Enrollment.findOne({
        studentId: student._id,
        courseId: batch.courseId._id,
      });

      if (existing && existing.status === 'ACTIVE') {
        return NextResponse.json({ error: 'Student is already actively enrolled in this course.' }, { status: 400 });
      }

      if (existing) {
        existing.status = 'ACTIVE';
        existing.batchId = batch._id;
        existing.enrolledBy = adminUser._id;
        await existing.save();
      } else {
        await Enrollment.create({
          studentId: student._id,
          courseId: batch.courseId._id,
          batchId: batch._id,
          status: 'ACTIVE',
          enrolledBy: adminUser._id,
        });
      }

      // Notify
      await Notification.create({
        userId: student._id,
        title: 'Batch Enrollment Confirmed',
        message: `You have been enrolled into batch "${batch.name}" (${batch.code}) by administration.`,
        type: 'ENROLLMENT',
        link: '/student/courses',
      });

      await AuditLog.create({
        action: 'STUDENT_ENROLLED_BY_ADMIN',
        performedBy: adminUser._id,
        targetType: 'Enrollment',
        details: { studentEmail: student.email, batchCode: batch.code },
      });

      return NextResponse.json({ success: true, message: `Student ${student.name} enrolled.` });
    }

    // 3. Transfer Student between Batches
    if (action === 'TRANSFER_STUDENT') {
      const { enrollmentId, toBatchId, reason } = body;
      const enrollment = await Enrollment.findById(enrollmentId);
      if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });

      const toBatch = await Batch.findById(toBatchId);
      if (!toBatch) return NextResponse.json({ error: 'Destination batch not found' }, { status: 404 });

      const fromBatchId = enrollment.batchId;

      enrollment.transferHistory.push({
        fromBatchId,
        toBatchId,
        transferredAt: new Date(),
        transferredBy: adminUser._id,
        reason: reason || 'Administrative transfer',
      });

      enrollment.batchId = toBatch._id;
      await enrollment.save();

      // Notify student
      await Notification.create({
        userId: enrollment.studentId,
        title: 'Cohort Batch Transferred',
        message: `Your cohort batch has been transferred to "${toBatch.name}" (${toBatch.code}).`,
        type: 'SYSTEM',
        link: '/student/courses',
      });

      await AuditLog.create({
        action: 'STUDENT_TRANSFERRED',
        performedBy: adminUser._id,
        targetType: 'Enrollment',
        targetId: enrollment._id,
        details: { toBatchCode: toBatch.code, reason },
      });

      return NextResponse.json({ success: true, message: 'Student transferred successfully.' });
    }

    // 4. Remove / Cancel Student Access
    if (action === 'REMOVE_STUDENT') {
      const { enrollmentId } = body;
      const enrollment = await Enrollment.findById(enrollmentId);
      if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });

      enrollment.status = 'CANCELLED';
      await enrollment.save();

      await AuditLog.create({
        action: 'STUDENT_ACCESS_REMOVED',
        performedBy: adminUser._id,
        targetType: 'Enrollment',
        targetId: enrollment._id,
        details: { studentId: enrollment.studentId },
      });

      return NextResponse.json({ success: true, message: 'Student access removed from batch.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Admin Batch API Error]:', error);
    return NextResponse.json({ error: 'Failed to process batch request' }, { status: 500 });
  }
}
