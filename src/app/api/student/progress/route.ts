import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Enrollment } from '@/models/Enrollment';
import { LessonProgress } from '@/models/LessonProgress';
import { Lesson } from '@/models/Lesson';
import { z } from 'zod';

const ProgressSchema = z.object({
  courseId: z.string(),
  lessonId: z.string(),
  isCompleted: z.boolean().optional(),
  videoPlaybackPositionSeconds: z.number().min(0).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ProgressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { courseId, lessonId, isCompleted, videoPlaybackPositionSeconds } = parsed.data;
    const studentId = session.user.id;

    await connectDB();

    // Verify student is actually enrolled in this course
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId,
      status: { $in: ['ACTIVE', 'COMPLETED'] },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Forbidden: You are not enrolled in this course' }, { status: 403 });
    }

    // Verify lesson exists in course
    const lesson = await Lesson.findOne({ _id: lessonId, courseId });
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Upsert lesson progress
    const updateFields: any = {
      moduleId: lesson.moduleId,
      lastAccessedAt: new Date(),
    };

    if (typeof isCompleted === 'boolean') {
      updateFields.isCompleted = isCompleted;
      if (isCompleted) {
        updateFields.completedAt = new Date();
      }
    }

    if (typeof videoPlaybackPositionSeconds === 'number') {
      updateFields.videoPlaybackPositionSeconds = videoPlaybackPositionSeconds;
    }

    const progress = await LessonProgress.findOneAndUpdate(
      { studentId, lessonId },
      {
        $set: updateFields,
        $setOnInsert: {
          studentId,
          courseId,
          lessonId,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      progress: {
        lessonId: progress.lessonId,
        isCompleted: progress.isCompleted,
        videoPlaybackPositionSeconds: progress.videoPlaybackPositionSeconds,
      },
    });
  } catch (error: any) {
    console.error('[Progress API Error]:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
