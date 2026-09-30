import mongoose, { Schema, Document, Model } from 'mongoose';

export type SubmissionStatus = 'SUBMITTED' | 'GRADED' | 'RESUBMISSION_REQUESTED';

export interface IGradingLog {
  score: number;
  feedback: string;
  gradedBy: mongoose.Types.ObjectId;
  gradedAt: Date;
}

export interface ISubmission extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  submittedAt: Date;
  isLate: boolean;
  submissionText: string;
  fileUrls: string[];
  status: SubmissionStatus;
  score?: number;
  feedback?: string;
  gradedBy?: mongoose.Types.ObjectId;
  gradedAt?: Date;
  gradingHistory: IGradingLog[];
  attemptNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

const GradingLogSchema = new Schema<IGradingLog>(
  {
    score: { type: Number, required: true },
    feedback: { type: String, default: '' },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gradedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SubmissionSchema = new Schema<ISubmission>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
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
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    submissionText: {
      type: String,
      default: '',
    },
    fileUrls: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['SUBMITTED', 'GRADED', 'RESUBMISSION_REQUESTED'],
      default: 'SUBMITTED',
      index: true,
    },
    score: {
      type: Number,
      default: null,
    },
    feedback: {
      type: String,
      default: '',
    },
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    gradedAt: {
      type: Date,
      default: null,
    },
    gradingHistory: {
      type: [GradingLogSchema],
      default: [],
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate active submission per student per assignment attempt
SubmissionSchema.index({ assignmentId: 1, studentId: 1, attemptNumber: 1 }, { unique: true });
SubmissionSchema.index({ assignmentId: 1, status: 1 });

export const Submission: Model<ISubmission> =
  mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
export default Submission;
