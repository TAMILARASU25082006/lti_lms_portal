import mongoose, { Schema, Document, Model } from 'mongoose';

export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'SUSPENDED';

export interface IEnrollment extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt?: Date;
  enrolledBy: mongoose.Types.ObjectId;
  transferHistory: Array<{
    fromBatchId: mongoose.Types.ObjectId;
    toBatchId: mongoose.Types.ObjectId;
    transferredAt: Date;
    transferredBy: mongoose.Types.ObjectId;
    reason?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'CANCELLED', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    enrolledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    transferHistory: [
      {
        fromBatchId: { type: Schema.Types.ObjectId, ref: 'Batch' },
        toBatchId: { type: Schema.Types.ObjectId, ref: 'Batch' },
        transferredAt: { type: Date, default: Date.now },
        transferredBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate active enrollments for the same student in the same course
EnrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
EnrollmentSchema.index({ batchId: 1, status: 1 });

export const Enrollment: Model<IEnrollment> =
  mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
export default Enrollment;
