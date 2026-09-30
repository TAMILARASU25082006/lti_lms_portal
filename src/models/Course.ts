import mongoose, { Schema, Document, Model } from 'mongoose';

export type CourseStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'ARCHIVED';
export type DeliveryMode = 'LIVE_ONLINE' | 'HYBRID' | 'SELF_PACED';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';

export interface ICourse extends Document {
  title: string;
  slug: string;
  summary: string;
  description: string;
  category: string;
  level: CourseLevel;
  deliveryMode: DeliveryMode;
  durationWeeks: number;
  estimatedHours: number;
  coverImage?: string;
  learningOutcomes: string[];
  prerequisites: string[];
  syllabusOverview: string;
  status: CourseStatus;
  primaryTutorId?: mongoose.Types.ObjectId;
  assignedTutorIds: mongoose.Types.ObjectId[];
  reviewFeedback?: string;
  publishedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: 160,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    summary: {
      type: String,
      required: true,
      maxlength: 300,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    level: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS'],
      default: 'INTERMEDIATE',
    },
    deliveryMode: {
      type: String,
      enum: ['LIVE_ONLINE', 'HYBRID', 'SELF_PACED'],
      default: 'HYBRID',
    },
    durationWeeks: {
      type: Number,
      default: 8,
      min: 1,
    },
    estimatedHours: {
      type: Number,
      default: 40,
      min: 1,
    },
    coverImage: {
      type: String,
      default: '',
    },
    learningOutcomes: {
      type: [String],
      default: [],
    },
    prerequisites: {
      type: [String],
      default: [],
    },
    syllabusOverview: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    primaryTutorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedTutorIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reviewFeedback: {
      type: String,
      default: '',
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Search index on title, summary, category
CourseSchema.index({ title: 'text', summary: 'text', category: 'text' });

export const Course: Model<ICourse> = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
export default Course;
