import mongoose, { Schema, Document, Model } from 'mongoose';

export type SessionStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

export interface ILiveSession extends Document {
  batchId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  tutorId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  meetingPlatform: 'GOOGLE_MEET' | 'ZOOM' | 'OTHER';
  meetingUrl: string;
  passcode?: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  status: SessionStatus;
  recordingUrl?: string;
  sessionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LiveSessionSchema = new Schema<ILiveSession>(
  {
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    tutorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    meetingPlatform: {
      type: String,
      enum: ['GOOGLE_MEET', 'ZOOM', 'OTHER'],
      default: 'GOOGLE_MEET',
    },
    meetingUrl: {
      type: String,
      required: true,
      trim: true,
    },
    passcode: {
      type: String,
      default: '',
    },
    scheduledStartTime: {
      type: Date,
      required: true,
      index: true,
    },
    scheduledEndTime: {
      type: Date,
      required: true,
    },
    actualStartTime: {
      type: Date,
      default: null,
    },
    actualEndTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
      index: true,
    },
    recordingUrl: {
      type: String,
      default: '',
    },
    sessionNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

LiveSessionSchema.index({ batchId: 1, scheduledStartTime: 1 });

export const LiveSession: Model<ILiveSession> =
  mongoose.models.LiveSession || mongoose.model<ILiveSession>('LiveSession', LiveSessionSchema);
export default LiveSession;
