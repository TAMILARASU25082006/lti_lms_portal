import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Course } from '@/models/Course';
import { Module } from '@/models/Module';
import { Lesson } from '@/models/Lesson';
import { Enrollment } from '@/models/Enrollment';
import { LessonProgress } from '@/models/LessonProgress';
import ClassroomPlayer from './ClassroomPlayer';

interface ClassroomPageProps {
  params: {
    courseId: string;
  };
  searchParams: {
    lessonId?: string;
  };
}

export default async function StudentClassroomPage({ params, searchParams }: ClassroomPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const studentId = session.user.id;
  const courseId = params.courseId;

  // 1. Strict Server-Side Enrollment Check: Student can ONLY access courses they are actively enrolled in!
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId,
    status: { $in: ['ACTIVE', 'COMPLETED'] },
  }).populate('batchId', 'name code');

  if (!enrollment) {
    redirect('/student?error=NotEnrolled');
  }

  // 2. Fetch Course
  const course = await Course.findById(courseId).lean();
  if (!course) notFound();

  // 3. Fetch Modules and Lessons
  const modules = await Module.find({ courseId, isPublished: true })
    .sort({ orderIndex: 1 })
    .lean();

  const moduleIds = modules.map((m) => m._id);
  const lessons = await Lesson.find({ moduleId: { $in: moduleIds }, isPublished: true })
    .sort({ orderIndex: 1 })
    .lean();

  if (lessons.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 m-8 max-w-lg mx-auto">
        <h3 className="text-lg font-bold text-navy-950">Curriculum Coming Soon</h3>
        <p className="text-xs text-slate-500 mt-1">
          Lessons for this course are currently being finalized by the instructor.
        </p>
      </div>
    );
  }

  // 4. Fetch Student's Progress Records for all lessons in this course
  const progressRecords = await LessonProgress.find({
    studentId,
    courseId,
  }).lean();

  const progressMap: Record<string, { isCompleted: boolean; videoPlaybackPositionSeconds: number }> = {};
  progressRecords.forEach((pr) => {
    if (!pr.lessonId) return;
    progressMap[pr.lessonId.toString()] = {
      isCompleted: pr.isCompleted,
      videoPlaybackPositionSeconds: pr.videoPlaybackPositionSeconds || 0,
    };
  });

  // Determine initial selected lesson
  const initialLessonId = searchParams.lessonId || lessons[0]._id.toString();

  return (
    <ClassroomPlayer
      course={JSON.parse(JSON.stringify(course))}
      modules={JSON.parse(JSON.stringify(modules))}
      lessons={JSON.parse(JSON.stringify(lessons))}
      initialProgressMap={progressMap}
      initialLessonId={initialLessonId}
      batchInfo={JSON.parse(JSON.stringify(enrollment.batchId || {}))}
    />
  );
}
