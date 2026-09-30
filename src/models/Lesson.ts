import mongoose, { Schema, Document, Model } from 'mongoose';

export type LessonContentType = 'TEXT' | 'VIDEO' | 'HYBRID';

export interface ILessonResource {
  title: string;
  url: string;
  fileType: string;
  sizeBytes?: number;
  isProtected: boolean;
}

export interface ILesson extends Document {
  courseId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  title: string;
  summary?: string;
  orderIndex: number;
  contentType: LessonContentType;
  contentHtml: string;
  videoUrl?: string;
  videoDurationSeconds: number;
  resources: ILessonResource[];
  isPublished: boolean;
  isFreePreview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LessonResourceSchema = new Schema<ILessonResource>(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    fileType: { type: String, default: 'pdf' },
    sizeBytes: { type: Number, default: 0 },
    isProtected: { type: Boolean, default: true },
  },
  { _id: false }
);

const LessonSchema = new Schema<ILesson>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      default: '',
    },
    orderIndex: {
      type: Number,
      required: true,
      default: 0,
    },
    contentType: {
      type: String,
      enum: ['TEXT', 'VIDEO', 'HYBRID'],
      default: 'HYBRID',
    },
    contentHtml: {
      type: String,
      default: '',
    },
    videoUrl: {
      type: String,
      default: '',
    },
    videoDurationSeconds: {
      type: Number,
      default: 0,
    },
    resources: {
      type: [LessonResourceSchema],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isFreePreview: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

LessonSchema.index({ moduleId: 1, orderIndex: 1 });

export const Lesson: Model<ILesson> = mongoose.models.Lesson || mongoose.model<ILesson>('Lesson', LessonSchema);
export default Lesson;
