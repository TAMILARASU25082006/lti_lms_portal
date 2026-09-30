import mongoose, { Schema, Document, Model } from 'mongoose';

export type CertificateStatus = 'ACTIVE' | 'REVOKED';

export interface ICertificate extends Document {
  certificateCode: string; // Unique alphanumeric code e.g. "CA-2026-8F29A"
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  enrollmentId: mongoose.Types.ObjectId;
  studentName: string;
  courseTitle: string;
  status: CertificateStatus;
  issuedAt: Date;
  issuedBy: mongoose.Types.ObjectId;
  revokedAt?: Date;
  revokedBy?: mongoose.Types.ObjectId;
  revocationReason?: string;
  attendancePercent: number;
  quizzesAveragePercent: number;
  assignmentsCompletedCount: number;
  pdfUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    certificateCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
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
    },
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    courseTitle: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'REVOKED'],
      default: 'ACTIVE',
      index: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    revocationReason: {
      type: String,
      default: '',
    },
    attendancePercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    quizzesAveragePercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    assignmentsCompletedCount: {
      type: Number,
      required: true,
      min: 0,
    },
    pdfUrl: {
      type: String,
      default: '',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate active certificates for the same student and course
CertificateSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export const Certificate: Model<ICertificate> =
  mongoose.models.Certificate || mongoose.model<ICertificate>('Certificate', CertificateSchema);
export default Certificate;
