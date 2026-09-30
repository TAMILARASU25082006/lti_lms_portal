import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Course } from '@/models/Course';
import { Module } from '@/models/Module';
import { Lesson } from '@/models/Lesson';
import { AuditLog } from '@/models/AuditLog';
import { User } from '@/models/User';
import { z } from 'zod';

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
    const action = body.action;

    // 1. Add Module
    if (action === 'ADD_MODULE') {
      const { courseId, title, summary } = body;
      if (!courseId || !title) {
        return NextResponse.json({ error: 'courseId and title are required' }, { status: 400 });
      }

      // Verify tutor assignment
      const course = await Course.findById(courseId);
      if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

      if (user.role === 'TUTOR') {
        const isAssigned =
          course.primaryTutorId?.toString() === user._id.toString() ||
          course.assignedTutorIds?.some((id) => id.toString() === user._id.toString());
        if (!isAssigned) {
          return NextResponse.json({ error: 'You are not assigned to manage this course' }, { status: 403 });
        }
      }

      const count = await Module.countDocuments({ courseId });
      const newModule = await Module.create({
        courseId,
        title,
        summary: summary || '',
        orderIndex: count + 1,
        isPublished: true,
      });

      return NextResponse.json({ success: true, module: newModule });
    }

    // 2. Add Lesson
    if (action === 'ADD_LESSON') {
      const { courseId, moduleId, title, contentType, contentHtml, videoUrl, resources } = body;
      if (!courseId || !moduleId || !title) {
        return NextResponse.json({ error: 'Missing required lesson fields' }, { status: 400 });
      }

      const course = await Course.findById(courseId);
      if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

      if (user.role === 'TUTOR') {
        const isAssigned =
          course.primaryTutorId?.toString() === user._id.toString() ||
          course.assignedTutorIds?.some((id) => id.toString() === user._id.toString());
        if (!isAssigned) {
          return NextResponse.json({ error: 'You are not assigned to manage this course' }, { status: 403 });
        }
      }

      const count = await Lesson.countDocuments({ moduleId });
      const newLesson = await Lesson.create({
        courseId,
        moduleId,
        title,
        contentType: contentType || 'HYBRID',
        contentHtml: contentHtml || '',
        videoUrl: videoUrl || '',
        resources: resources || [],
        orderIndex: count + 1,
        isPublished: true,
      });

      return NextResponse.json({ success: true, lesson: newLesson });
    }

    // 3. Submit Course for Admin Publication Approval
    if (action === 'SUBMIT_APPROVAL') {
      const { courseId } = body;
      const course = await Course.findById(courseId);
      if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

      if (user.role === 'TUTOR') {
        const isAssigned =
          course.primaryTutorId?.toString() === user._id.toString() ||
          course.assignedTutorIds?.some((id) => id.toString() === user._id.toString());
        if (!isAssigned) {
          return NextResponse.json({ error: 'You are not assigned to manage this course' }, { status: 403 });
        }
      }

      course.status = 'PENDING_APPROVAL';
      await course.save();

      await AuditLog.create({
        action: 'COURSE_SUBMITTED_FOR_APPROVAL',
        performedBy: user._id,
        targetType: 'Course',
        targetId: course._id,
        details: { courseTitle: course.title, submittedByTutor: user.name },
      });

      return NextResponse.json({ success: true, message: 'Curriculum submitted to administration for publication review.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Tutor Course API Error]:', error);
    return NextResponse.json({ error: 'Failed to process course modification' }, { status: 500 });
  }
}
