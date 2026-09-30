import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Batch } from '@/models/Batch';
import { Enrollment } from '@/models/Enrollment';
import { LiveSession } from '@/models/LiveSession';
import { Announcement } from '@/models/Announcement';
import { Attendance } from '@/models/Attendance';
import BatchDetailClient from './BatchDetailClient';

interface BatchPageProps {
  params: {
    batchId: string;
  };
}

export default async function TutorBatchDetailPage({ params }: BatchPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const tutorId = session.user.id;
  const batchId = params.batchId;

  const batch = await Batch.findById(batchId).populate('courseId', 'title slug').lean();
  if (!batch) notFound();

  // Verify tutor is assigned (unless ADMIN)
  if (session.user.role !== 'ADMIN') {
    const isAssigned = batch.assignedTutorIds?.some((id: any) => id.toString() === tutorId);
    if (!isAssigned) {
      redirect('/tutor/batches?error=UnauthorizedBatch');
    }
  }

  // Fetch enrolled students
  const enrollments = await Enrollment.find({ batchId, status: 'ACTIVE' })
    .populate('studentId', 'name email image phone headline')
    .sort({ enrolledAt: -1 })
    .lean();

  // Fetch live sessions
  const liveSessions = await LiveSession.find({ batchId })
    .populate('tutorId', 'name')
    .sort({ scheduledStartTime: -1 })
    .lean();

  // Fetch batch announcements
  const announcements = await Announcement.find({ batchId })
    .populate('authorId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  // Fetch attendance records for sessions in this batch
  const sessionIds = liveSessions.map((s) => s._id);
  const attendanceRecords = await Attendance.find({ liveSessionId: { $in: sessionIds } }).lean();

  return (
    <BatchDetailClient
      batch={JSON.parse(JSON.stringify(batch))}
      initialEnrollments={JSON.parse(JSON.stringify(enrollments))}
      initialLiveSessions={JSON.parse(JSON.stringify(liveSessions))}
      initialAnnouncements={JSON.parse(JSON.stringify(announcements))}
      initialAttendanceRecords={JSON.parse(JSON.stringify(attendanceRecords))}
    />
  );
}
