import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'STUDENT' | 'TUTOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface IUser extends Document {
  name: string;
  email: string;
  emailVerified: Date | null;
  image?: string;
  role: UserRole;
  status: UserStatus;
  googleProviderId?: string;
  timezone: string;
  phone?: string;
  bio?: string;
  headline?: string;
  invitedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    emailVerified: {
      type: Date,
      default: null,
    },
    image: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['STUDENT', 'TUTOR', 'ADMIN'],
      default: 'STUDENT',
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    googleProviderId: {
      type: String,
      sparse: true,
      index: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    phone: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    headline: {
      type: String,
      default: '',
      maxlength: 200,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of model in Next.js development
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
