import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Attendance } from '@/models/Attendance';
import { LessonProgress } from '@/models/LessonProgress';
import { Lesson } from '@/models/Lesson';
import { Enrollment } from '@/models/Enrollment';
import { QuizAttempt } from '@/models/QuizAttempt';
import { Submission } from '@/models/Submission';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';

function escapeCsvField(field: any): string {
  if (field === null || field === undefined) return '';
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectDB();
    const adminUser = await User.findById(session.user.id);
    if (!adminUser || adminUser.status === 'SUSPENDED' || adminUser.role !== 'ADMIN') {
      return new NextResponse('Requires Administrator privilege', { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || 'attendance';

    let csvContent = '';
    let filename = `report-${type}-${Date.now()}.csv`;

    if (type === 'attendance') {
      const records = await Attendance.find()
        .populate('studentId', 'name email')
        .populate('liveSessionId', 'title scheduledStartTime')
        .populate('batchId', 'code')
        .sort({ createdAt: -1 })
        .lean();

      const headers = ['Student Name', 'Student Email', 'Session Title', 'Batch Code', 'Session Date', 'Status', 'Minutes Attended'];
      const rows = records.map((r: any) => [
        escapeCsvField(r.studentId?.name || 'N/A'),
        escapeCsvField(r.studentId?.email || 'N/A'),
        escapeCsvField(r.liveSessionId?.title || 'Live Session'),
        escapeCsvField(r.batchId?.code || 'N/A'),
        escapeCsvField(r.liveSessionId?.scheduledStartTime ? new Date(r.liveSessionId.scheduledStartTime).toISOString() : ''),
        escapeCsvField(r.status),
        escapeCsvField(r.minutesAttended),
      ]);

      csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    } else if (type === 'progress') {
      const enrollments = await Enrollment.find({ status: 'ACTIVE' })
        .populate('studentId', 'name email')
        .populate('courseId', 'title')
        .populate('batchId', 'code')
        .lean();

      const headers = ['Student Name', 'Student Email', 'Course Title', 'Batch Code', 'Completed Lessons', 'Total Lessons', 'Completion Percent'];
      const rows = await Promise.all(
        enrollments.map(async (enr: any) => {
          const total = await Lesson.countDocuments({ courseId: enr.courseId?._id, isPublished: true });
          const completed = await LessonProgress.countDocuments({
            studentId: enr.studentId?._id,
            courseId: enr.courseId?._id,
            isCompleted: true,
          });
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          return [
            escapeCsvField(enr.studentId?.name || 'N/A'),
            escapeCsvField(enr.studentId?.email || 'N/A'),
            escapeCsvField(enr.courseId?.title || 'N/A'),
            escapeCsvField(enr.batchId?.code || 'N/A'),
            escapeCsvField(completed),
            escapeCsvField(total),
            escapeCsvField(`${pct}%`),
          ];
        })
      );

      csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    } else if (type === 'assessments') {
      const attempts = await QuizAttempt.find({ isCompleted: true })
        .populate('studentId', 'name email')
        .populate('quizId', 'title')
        .populate('batchId', 'code')
        .sort({ createdAt: -1 })
        .lean();

      const headers = ['Student Name', 'Student Email', 'Quiz Title', 'Cohort Batch', 'Attempt Number', 'Score', 'Total Possible', 'Percentage', 'Passed'];
      const rows = attempts.map((att: any) => [
        escapeCsvField(att.studentId?.name || 'N/A'),
        escapeCsvField(att.studentId?.email || 'N/A'),
        escapeCsvField(att.quizId?.title || 'Quiz'),
        escapeCsvField(att.batchId?.code || 'N/A'),
        escapeCsvField(att.attemptNumber),
        escapeCsvField(att.score),
        escapeCsvField(att.totalPointsPossible),
        escapeCsvField(`${att.percentage}%`),
        escapeCsvField(att.isPassed ? 'YES' : 'NO'),
      ]);

      csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    } else if (type === 'assignments') {
      const submissions = await Submission.find()
        .populate('studentId', 'name email')
        .populate('assignmentId', 'title totalPoints')
        .populate('batchId', 'code')
        .populate('gradedBy', 'name')
        .sort({ submittedAt: -1 })
        .lean();

      const headers = ['Student Name', 'Student Email', 'Assignment Title', 'Cohort Batch', 'Submitted At', 'Is Late', 'Status', 'Score', 'Total Points', 'Graded By'];
      const rows = submissions.map((sub: any) => [
        escapeCsvField(sub.studentId?.name || 'N/A'),
        escapeCsvField(sub.studentId?.email || 'N/A'),
        escapeCsvField(sub.assignmentId?.title || 'Assignment'),
        escapeCsvField(sub.batchId?.code || 'N/A'),
        escapeCsvField(sub.submittedAt ? new Date(sub.submittedAt).toISOString() : ''),
        escapeCsvField(sub.isLate ? 'YES' : 'NO'),
        escapeCsvField(sub.status),
        escapeCsvField(sub.score !== null ? sub.score : 'UNGRADED'),
        escapeCsvField(sub.assignmentId?.totalPoints || 100),
        escapeCsvField(sub.gradedBy?.name || 'Unassigned'),
      ]);

      csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    }

    await AuditLog.create({
      action: 'CSV_REPORT_EXPORTED',
      performedBy: adminUser._id,
      targetType: 'Report',
      details: { reportType: type },
    });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('[CSV Export Error]:', error);
    return new NextResponse('Export generation failed', { status: 500 });
  }
}
