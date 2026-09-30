import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Enrollment } from '@/models/Enrollment';
import { Course } from '@/models/Course';
import { Lesson } from '@/models/Lesson';
import { LessonProgress } from '@/models/LessonProgress';
import { LiveSession } from '@/models/LiveSession';
import { Attendance } from '@/models/Attendance';
import { Quiz } from '@/models/Quiz';
import { QuizAttempt } from '@/models/QuizAttempt';
import { Assignment } from '@/models/Assignment';
import { Submission } from '@/models/Submission';
import { Certificate } from '@/models/Certificate';
import { AcademySettings } from '@/models/AcademySettings';
import { generateCertificateCode } from '@/lib/utils';
import { z } from 'zod';

const ClaimSchema = z.object({
  courseId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ClaimSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid courseId' }, { status: 400 });
    }

    const { courseId } = parsed.data;
    const studentId = session.user.id;

    await connectDB();

    // 1. Verify active enrollment
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId,
      status: { $in: ['ACTIVE', 'COMPLETED'] },
    }).populate('courseId batchId');

    if (!enrollment) {
      return NextResponse.json({ error: 'You are not actively enrolled in this course.' }, { status: 403 });
    }

    // 2. Check if already has certificate
    const existingCert = await Certificate.findOne({
      studentId,
      courseId,
      status: 'ACTIVE',
    });

    if (existingCert) {
      return NextResponse.json({
        success: true,
        message: 'Certificate already issued.',
        certificate: existingCert,
      });
    }

    // 3. Load Academy Settings
    const settings = (await AcademySettings.findOne().lean()) || {
      minAttendancePercentForCert: 80,
      minQuizScorePercentForCert: 70,
      requireAllAssignmentsPassed: true,
    };

    // Check Lesson Completion: All published lessons must be completed
    const totalLessons = await Lesson.countDocuments({ courseId, isPublished: true });
    const completedLessons = await LessonProgress.countDocuments({ studentId, courseId, isCompleted: true });

    if (completedLessons < totalLessons && totalLessons > 0) {
      return NextResponse.json({
        error: `Incomplete coursework: You have completed ${completedLessons} of ${totalLessons} lessons.`,
      }, { status: 400 });
    }

    // Check Attendance Rate
    const totalSessions = await LiveSession.countDocuments({ batchId: enrollment.batchId._id, status: 'COMPLETED' });
    let attendancePercent = 100;
    if (totalSessions > 0) {
      const attendedCount = await Attendance.countDocuments({
        studentId,
        batchId: enrollment.batchId._id,
        status: { $in: ['PRESENT', 'LATE'] },
      });
      attendancePercent = Math.round((attendedCount / totalSessions) * 100);
      if (attendancePercent < settings.minAttendancePercentForCert) {
        return NextResponse.json({
          error: `Attendance requirement not met: Current attendance is ${attendancePercent}%, minimum required is ${settings.minAttendancePercentForCert}%.`,
        }, { status: 400 });
      }
    }

    // Check Quizzes
    const quizzes = await Quiz.find({ courseId, isPublished: true });
    let quizzesAverage = 100;
    if (quizzes.length > 0) {
      const quizIds = quizzes.map((q) => q._id);
      const passedAttempts = await QuizAttempt.find({
        quizId: { $in: quizIds },
        studentId,
        isPassed: true,
      });

      const passedQuizSet = new Set(passedAttempts.map((a) => a.quizId.toString()));
      if (passedQuizSet.size < quizzes.length) {
        return NextResponse.json({
          error: `Quiz requirement not met: You must pass all ${quizzes.length} cohort quizzes before certificate issuance.`,
        }, { status: 400 });
      }

      const totalPct = passedAttempts.reduce((acc, curr) => acc + curr.percentage, 0);
      quizzesAverage = Math.round(totalPct / passedAttempts.length);
    }

    // Check Assignments
    const assignments = await Assignment.find({ courseId, isPublished: true });
    let assignmentsCompletedCount = 0;
    if (assignments.length > 0 && settings.requireAllAssignmentsPassed) {
      const assignmentIds = assignments.map((a) => a._id);
      const gradedSubmissions = await Submission.find({
        assignmentId: { $in: assignmentIds },
        studentId,
        status: 'GRADED',
      });

      assignmentsCompletedCount = gradedSubmissions.length;
      if (gradedSubmissions.length < assignments.length) {
        return NextResponse.json({
          error: `Assignments incomplete: ${gradedSubmissions.length} of ${assignments.length} assignments graded.`,
        }, { status: 400 });
      }
    }

    // 4. Generate unique Certificate
    const certificateCode = generateCertificateCode();

    const cert = await Certificate.create({
      certificateCode,
      studentId,
      courseId,
      batchId: enrollment.batchId._id,
      enrollmentId: enrollment._id,
      studentName: session.user.name || 'Academy Graduate',
      courseTitle: (enrollment.courseId as any).title,
      status: 'ACTIVE',
      issuedAt: new Date(),
      issuedBy: studentId,
      attendancePercent,
      quizzesAveragePercent: quizzesAverage,
      assignmentsCompletedCount,
    });

    // Mark enrollment as COMPLETED
    enrollment.status = 'COMPLETED';
    enrollment.completedAt = new Date();
    await enrollment.save();

    return NextResponse.json({
      success: true,
      message: 'Certificate issued successfully!',
      certificate: cert,
    });
  } catch (error: any) {
    console.error('[Certificate Claim Error]:', error);
    return NextResponse.json({ error: 'Failed to issue certificate' }, { status: 500 });
  }
}
