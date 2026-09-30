import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType =
  | 'ENROLLMENT'
  | 'ASSIGNMENT'
  | 'GRADE'
  | 'LIVE_SESSION'
  | 'CERTIFICATE'
  | 'ANNOUNCEMENT'
  | 'SYSTEM';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['ENROLLMENT', 'ASSIGNMENT', 'GRADE', 'LIVE_SESSION', 'CERTIFICATE', 'ANNOUNCEMENT', 'SYSTEM'],
      default: 'SYSTEM',
    },
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;
