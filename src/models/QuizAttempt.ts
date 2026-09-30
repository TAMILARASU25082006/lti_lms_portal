import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStudentAnswer {
  questionId: string;
  selectedOptionId: string;
  isCorrect?: boolean;
  pointsAwarded?: number;
}

export interface IQuizAttempt extends Document {
  quizId: mongoose.Types.ObjectId;
  quizVersion: number;
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  attemptNumber: number;
  startedAt: Date;
  deadline?: Date; // Server-enforced deadline based on quiz.timeLimitMinutes
  submittedAt?: Date;
  isCompleted: boolean;
  questionSnapshot: Array<{
    questionId: string;
    prompt: string;
    options: Array<{ id: string; text: string }>;
    points: number;
  }>;
  answers: IStudentAnswer[];
  score: number;
  totalPointsPossible: number;
  percentage: number;
  isPassed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StudentAnswerSchema = new Schema<IStudentAnswer>(
  {
    questionId: { type: String, required: true },
    selectedOptionId: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
    pointsAwarded: { type: Number, default: 0 },
  },
  { _id: false }
);

const QuestionSnapshotSchema = new Schema(
  {
    questionId: { type: String, required: true },
    prompt: { type: String, required: true },
    options: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true },
      },
    ],
    points: { type: Number, required: true },
  },
  { _id: false }
);

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true,
    },
    quizVersion: {
      type: Number,
      required: true,
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
    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    questionSnapshot: {
      type: [QuestionSnapshotSchema],
      default: [],
    },
    answers: {
      type: [StudentAnswerSchema],
      default: [],
    },
    score: {
      type: Number,
      default: 0,
    },
    totalPointsPossible: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    isPassed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attempts per number
QuizAttemptSchema.index({ quizId: 1, studentId: 1, attemptNumber: 1 }, { unique: true });
QuizAttemptSchema.index({ studentId: 1, courseId: 1 });

export const QuizAttempt: Model<IQuizAttempt> =
  mongoose.models.QuizAttempt || mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);
export default QuizAttempt;
