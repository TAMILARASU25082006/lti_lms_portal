import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Course } from '@/models/Course';
import { Module } from '@/models/Module';
import { Lesson } from '@/models/Lesson';
import CurriculumBuilderClient from './CurriculumBuilderClient';

interface BuilderPageProps {
  params: {
    courseId: string;
  };
}

export default async function TutorCourseBuilderPage({ params }: BuilderPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  await connectDB();
  const tutorId = session.user.id;
  const courseId = params.courseId;

  const course = await Course.findById(courseId).lean();
  if (!course) notFound();

  // Verify tutor is assigned to this course (unless ADMIN)
  if (session.user.role !== 'ADMIN') {
    const primaryId = (course.primaryTutorId as any)?._id
      ? (course.primaryTutorId as any)._id.toString()
      : course.primaryTutorId?.toString();
    const isAssigned =
      primaryId === tutorId ||
      course.assignedTutorIds?.some((id: any) => (id?._id || id)?.toString() === tutorId);
    if (!isAssigned) {
      redirect('/tutor/courses?error=UnauthorizedCourse');
    }
  }

  // Fetch modules and lessons
  const modules = await Module.find({ courseId }).sort({ orderIndex: 1 }).lean();
  const moduleIds = modules.map((m) => m._id);
  const lessons = await Lesson.find({ moduleId: { $in: moduleIds } }).sort({ orderIndex: 1 }).lean();

  return (
    <CurriculumBuilderClient
      course={JSON.parse(JSON.stringify(course))}
      initialModules={JSON.parse(JSON.stringify(modules))}
      initialLessons={JSON.parse(JSON.stringify(lessons))}
    />
  );
}
