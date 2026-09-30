import mongoose, { Schema, Document, Model } from 'mongoose';

export type BatchStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface IBatch extends Document {
  name: string;
  code: string;
  courseId: mongoose.Types.ObjectId;
  assignedTutorIds: mongoose.Types.ObjectId[];
  startDate: Date;
  endDate: Date;
  scheduleDescription: string; // e.g. "Mon & Wed 18:00 - 20:00 UTC"
  maxCapacity: number;
  status: BatchStatus;
  meetingPlatform: 'GOOGLE_MEET' | 'ZOOM' | 'OTHER';
  defaultMeetingUrl?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    assignedTutorIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    scheduleDescription: {
      type: String,
      default: '',
    },
    maxCapacity: {
      type: Number,
      default: 40,
    },
    status: {
      type: String,
      enum: ['UPCOMING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'],
      default: 'UPCOMING',
      index: true,
    },
    meetingPlatform: {
      type: String,
      enum: ['GOOGLE_MEET', 'ZOOM', 'OTHER'],
      default: 'GOOGLE_MEET',
    },
    defaultMeetingUrl: {
      type: String,
      default: '',
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

BatchSchema.index({ courseId: 1, status: 1 });

export const Batch: Model<IBatch> = mongoose.models.Batch || mongoose.model<IBatch>('Batch', BatchSchema);
export default Batch;
