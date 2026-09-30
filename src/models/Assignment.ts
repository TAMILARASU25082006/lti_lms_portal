import mongoose, { Schema, Document, Model } from 'mongoose';

export type ScopeType = 'COURSE_WIDE' | 'BATCH_SPECIFIC';

export interface IAssignment extends Document {
  courseId: mongoose.Types.ObjectId;
  batchId?: mongoose.Types.ObjectId; // null if COURSE_WIDE
  scope: ScopeType;
  title: string;
  description: string;
  rubricCriteria?: string;
  totalPoints: number;
  dueDate: Date;
  allowLateSubmissions: boolean;
  latePenaltyPercentPerDay?: number;
  attachmentUrls: string[];
  isPublished: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
      index: true,
    },
    scope: {
      type: String,
      enum: ['COURSE_WIDE', 'BATCH_SPECIFIC'],
      default: 'COURSE_WIDE',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    rubricCriteria: {
      type: String,
      default: '',
    },
    totalPoints: {
      type: Number,
      required: true,
      default: 100,
      min: 1,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    allowLateSubmissions: {
      type: Boolean,
      default: true,
    },
    latePenaltyPercentPerDay: {
      type: Number,
      default: 5,
    },
    attachmentUrls: {
      type: [String],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

AssignmentSchema.index({ courseId: 1, dueDate: 1 });

export const Assignment: Model<IAssignment> =
  mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);
export default Assignment;
