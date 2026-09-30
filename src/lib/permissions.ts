import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { connectDB } from './db';
import { User, UserRole, IUser } from '@/models/User';
import { Enrollment } from '@/models/Enrollment';
import { Course } from '@/models/Course';
import { Batch } from '@/models/Batch';
import mongoose from 'mongoose';

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export async function getCurrentUser(): Promise<IUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || user.status === 'SUSPENDED') {
    return null;
  }
  return user;
}

export async function requireAuth(): Promise<IUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError('Authentication required or account suspended', 401);
  }
  return user;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<IUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError(`Access forbidden: requires ${allowedRoles.join(' or ')} privilege`, 403);
  }
  return user;
}

export async function requireAdmin(): Promise<IUser> {
  return requireRole(['ADMIN']);
}

export async function requireTutorOrAdmin(): Promise<IUser> {
  return requireRole(['TUTOR', 'ADMIN']);
}

export async function verifyCourseTutorAccess(tutorId: string | mongoose.Types.ObjectId, courseId: string | mongoose.Types.ObjectId): Promise<boolean> {
  await connectDB();
  const course = await Course.findById(courseId);
  if (!course) return false;

  const tId = tutorId.toString();
  if (course.primaryTutorId?.toString() === tId) return true;
  if (course.assignedTutorIds?.some((id) => id.toString() === tId)) return true;
  return false;
}

export async function verifyBatchTutorAccess(tutorId: string | mongoose.Types.ObjectId, batchId: string | mongoose.Types.ObjectId): Promise<boolean> {
  await connectDB();
  const batch = await Batch.findById(batchId);
  if (!batch) return false;

  const tId = tutorId.toString();
  if (batch.assignedTutorIds?.some((id) => id.toString() === tId)) return true;
  return false;
}

export async function verifyStudentEnrollment(studentId: string | mongoose.Types.ObjectId, courseId: string | mongoose.Types.ObjectId): Promise<boolean> {
  await connectDB();
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId,
    status: { $in: ['ACTIVE', 'COMPLETED'] },
  });
  return !!enrollment;
}

export async function getStudentBatch(studentId: string | mongoose.Types.ObjectId, courseId: string | mongoose.Types.ObjectId) {
  await connectDB();
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId,
    status: { $in: ['ACTIVE', 'COMPLETED'] },
  }).populate('batchId');
  return enrollment?.batchId || null;
}
