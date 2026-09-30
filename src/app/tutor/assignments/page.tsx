import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Course } from '@/models/Course';
import { Batch } from '@/models/Batch';
import { Assignment } from '@/models/Assignment';
import { Submission } from '@/models/Submission';
import DashboardHeader from '@/components/DashboardHeader';
import TutorAssignmentConsole from './TutorAssignmentConsole';

export const dynamic = 'force-dynamic';

export default async function TutorAssignmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const tutorId = session.user.id;

  // 1. Fetch assigned courses
  const coursesFilter =
    session.user.role === 'ADMIN'
      ? {}
      : {
          $or: [{ primaryTutorId: tutorId }, { assignedTutorIds: tutorId }],
        };

  const assignedCourses = await Course.find(coursesFilter).select('title _id').lean();
  const courseIds = assignedCourses.map((c) => c._id);

  // 2. Fetch assigned batches
  const batchesFilter =
    session.user.role === 'ADMIN'
      ? {}
      : {
          assignedTutorIds: tutorId,
        };

  const assignedBatches = await Batch.find(batchesFilter).select('name code _id courseId').lean();

  // 3. Fetch assignments in assigned courses
  const assignments = await Assignment.find({ courseId: { $in: courseIds } })
    .populate('courseId', 'title')
    .populate('batchId', 'code name')
    .sort({ createdAt: -1 })
    .lean();

  const assignmentIds = assignments.map((a) => a._id);

  // 4. Fetch submissions to grade
  const submissions = await Submission.find({ assignmentId: { $in: assignmentIds } })
    .populate('studentId', 'name email image')
    .populate('assignmentId', 'title totalPoints')
    .populate('batchId', 'code name')
    .sort({ submittedAt: -1 })
    .lean();

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Assignments & Student Submissions"
        subtitle="Create practical lab assignments, review student code repositories, and record grading feedback."
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
        <TutorAssignmentConsole
          assignedCourses={JSON.parse(JSON.stringify(assignedCourses))}
          assignedBatches={JSON.parse(JSON.stringify(assignedBatches))}
          initialAssignments={JSON.parse(JSON.stringify(assignments))}
          initialSubmissions={JSON.parse(JSON.stringify(submissions))}
        />
      </div>
    </div>
  );
}
