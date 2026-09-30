import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Enrollment } from '@/models/Enrollment';
import { Assignment } from '@/models/Assignment';
import { Submission } from '@/models/Submission';
import { User } from '@/models/User';
import DashboardHeader from '@/components/DashboardHeader';
import AssignmentClientList from './AssignmentClientList';

export const dynamic = 'force-dynamic';

export default async function StudentAssignmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const studentId = session.user.id;
  const user = await User.findById(studentId).lean();
  const timezone = user?.timezone || 'UTC';

  // 1. Get student's enrolled courses and batches
  const enrollments = await Enrollment.find({
    studentId,
    status: { $in: ['ACTIVE', 'COMPLETED'] },
  }).lean();

  const courseIds = enrollments.map((e) => e.courseId);
  const batchIds = enrollments.map((e) => e.batchId);

  // 2. Fetch assignments
  const assignments = await Assignment.find({
    $or: [{ courseId: { $in: courseIds }, scope: 'COURSE_WIDE' }, { batchId: { $in: batchIds } }],
    isPublished: true,
  })
    .populate('courseId', 'title')
    .sort({ dueDate: 1 })
    .lean();

  // 3. Fetch student's submissions
  const assignmentIds = assignments.map((a) => a._id);
  const submissions = await Submission.find({
    assignmentId: { $in: assignmentIds },
    studentId,
  })
    .populate('gradedBy', 'name')
    .sort({ attemptNumber: -1 })
    .lean();

  // Map latest submission by assignmentId
  const submissionMap: Record<string, any> = {};
  submissions.forEach((s) => {
    const aId = s.assignmentId.toString();
    if (!submissionMap[aId]) {
      submissionMap[aId] = s;
    }
  });

  const assignmentData = assignments.map((a) => {
    const aId = a._id.toString();
    return {
      ...a,
      submission: submissionMap[aId] || null,
    };
  });

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Assignments & Lab Submissions"
        subtitle="Submit your coursework for tutor grading and review direct feedback."
        userTimezone={timezone}
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
        <AssignmentClientList assignments={JSON.parse(JSON.stringify(assignmentData))} timezone={timezone} />
      </div>
    </div>
  );
}
