import mongoose, { Schema, Document, Model } from 'mongoose';

export type AnswerReviewPolicy = 'ALWAYS' | 'AFTER_SUBMISSION' | 'NEVER';

export interface IQuizQuestion {
  questionId: string;
  prompt: string;
  options: Array<{
    id: string;
    text: string;
  }>;
  correctOptionId: string;
  explanation?: string;
  points: number;
}

export interface IQuiz extends Document {
  courseId: mongoose.Types.ObjectId;
  batchId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  version: number;
  timeLimitMinutes: number; // 0 = untimed
  maxAttempts: number;
  passingScorePercent: number;
  permitAnswerReview: AnswerReviewPolicy;
  questions: IQuizQuestion[];
  isPublished: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>(
  {
    questionId: { type: String, required: true },
    prompt: { type: String, required: true },
    options: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true },
      },
    ],
    correctOptionId: { type: String, required: true },
    explanation: { type: String, default: '' },
    points: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
);

const QuizSchema = new Schema<IQuiz>(
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    version: {
      type: Number,
      default: 1,
    },
    timeLimitMinutes: {
      type: Number,
      default: 15,
      min: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
      min: 1,
    },
    passingScorePercent: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    permitAnswerReview: {
      type: String,
      enum: ['ALWAYS', 'AFTER_SUBMISSION', 'NEVER'],
      default: 'AFTER_SUBMISSION',
    },
    questions: {
      type: [QuizQuestionSchema],
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

QuizSchema.index({ courseId: 1, isPublished: 1 });

export const Quiz: Model<IQuiz> = mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);
export default Quiz;
