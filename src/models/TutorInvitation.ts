import mongoose, { Schema, Document, Model } from 'mongoose';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export interface ITutorInvitation extends Document {
  email: string;
  token: string;
  role: 'TUTOR';
  invitedBy: mongoose.Types.ObjectId;
  assignedCourses?: mongoose.Types.ObjectId[];
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedByUserId?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TutorInvitationSchema = new Schema<ITutorInvitation>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    role: {
      type: String,
      default: 'TUTOR',
      immutable: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedCourses: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    acceptedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying active pending invitations by email
TutorInvitationSchema.index({ email: 1, status: 1 });

export const TutorInvitation: Model<ITutorInvitation> =
  mongoose.models.TutorInvitation || mongoose.model<ITutorInvitation>('TutorInvitation', TutorInvitationSchema);
export default TutorInvitation;
