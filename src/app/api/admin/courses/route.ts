import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Course } from '@/models/Course';
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

    // 1. Create Course
    if (action === 'CREATE_COURSE') {
      const {
        title,
        slug,
        summary,
        description,
        category,
        level,
        deliveryMode,
        durationWeeks,
        estimatedHours,
        learningOutcomes,
        prerequisites,
        primaryTutorId,
      } = body;

      if (!title || !slug || !summary || !description || !category) {
        return NextResponse.json({ error: 'Missing required course fields' }, { status: 400 });
      }

      const existing = await Course.findOne({ slug: slug.toLowerCase().trim() });
      if (existing) {
        return NextResponse.json({ error: 'A course with this URL slug already exists.' }, { status: 400 });
      }

      const course = await Course.create({
        title: title.trim(),
        slug: slug.toLowerCase().trim(),
        summary: summary.trim(),
        description: description.trim(),
        category: category.trim(),
        level: level || 'INTERMEDIATE',
        deliveryMode: deliveryMode || 'HYBRID',
        durationWeeks: Number(durationWeeks) || 8,
        estimatedHours: Number(estimatedHours) || 40,
        learningOutcomes: Array.isArray(learningOutcomes) ? learningOutcomes : [],
        prerequisites: Array.isArray(prerequisites) ? prerequisites : [],
        primaryTutorId: primaryTutorId || null,
        assignedTutorIds: primaryTutorId ? [primaryTutorId] : [],
        status: 'DRAFT',
        createdBy: adminUser._id,
      });

      await AuditLog.create({
        action: 'COURSE_CREATED',
        performedBy: adminUser._id,
        targetType: 'Course',
        targetId: course._id,
        details: { title: course.title, slug: course.slug },
      });

      return NextResponse.json({ success: true, course });
    }

    // 2. Approve Publication
    if (action === 'APPROVE_PUBLICATION') {
      const { courseId } = body;
      const course = await Course.findById(courseId);
      if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

      course.status = 'PUBLISHED';
      course.publishedAt = new Date();
      course.reviewFeedback = '';
      await course.save();

      // Notify tutors
      if (course.primaryTutorId) {
        await Notification.create({
          userId: course.primaryTutorId,
          title: 'Course Published!',
          message: `"${course.title}" has been approved by administration and is now live.`,
          type: 'SYSTEM',
          link: `/courses/${course.slug}`,
        });
      }

      await AuditLog.create({
        action: 'COURSE_PUBLISHED',
        performedBy: adminUser._id,
        targetType: 'Course',
        targetId: course._id,
        details: { courseTitle: course.title },
      });

      return NextResponse.json({ success: true, message: 'Course curriculum published.' });
    }

    // 3. Reject Course with Feedback
    if (action === 'REJECT_COURSE') {
      const { courseId, feedback } = body;
      const course = await Course.findById(courseId);
      if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

      course.status = 'DRAFT';
      course.reviewFeedback = feedback || 'Revisions required by academic dean.';
      await course.save();

      if (course.primaryTutorId) {
        await Notification.create({
          userId: course.primaryTutorId,
          title: 'Course Revisions Requested',
          message: `Revisions requested for "${course.title}": ${course.reviewFeedback}`,
          type: 'SYSTEM',
          link: `/tutor/courses/${course._id}/builder`,
        });
      }

      await AuditLog.create({
        action: 'COURSE_REVISIONS_REQUESTED',
        performedBy: adminUser._id,
        targetType: 'Course',
        targetId: course._id,
        details: { courseTitle: course.title, feedback },
      });

      return NextResponse.json({ success: true, message: 'Feedback sent to tutor.' });
    }

    // 4. Archive Course
    if (action === 'ARCHIVE_COURSE') {
      const { courseId } = body;
      const course = await Course.findById(courseId);
      if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

      course.status = 'ARCHIVED';
      await course.save();

      await AuditLog.create({
        action: 'COURSE_ARCHIVED',
        performedBy: adminUser._id,
        targetType: 'Course',
        targetId: course._id,
        details: { courseTitle: course.title },
      });

      return NextResponse.json({ success: true, message: 'Course archived.' });
    }

    // 5. Assign Tutors
    if (action === 'ASSIGN_TUTORS') {
      const { courseId, primaryTutorId, assignedTutorIds } = body;
      const course = await Course.findById(courseId);
      if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

      course.primaryTutorId = primaryTutorId || null;
      course.assignedTutorIds = assignedTutorIds || [];
      await course.save();

      await AuditLog.create({
        action: 'COURSE_TUTORS_UPDATED',
        performedBy: adminUser._id,
        targetType: 'Course',
        targetId: course._id,
        details: { courseTitle: course.title, primaryTutorId },
      });

      return NextResponse.json({ success: true, message: 'Tutor assignments updated.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Admin Course API Error]:', error);
    return NextResponse.json({ error: 'Failed to process course request' }, { status: 500 });
  }
}
