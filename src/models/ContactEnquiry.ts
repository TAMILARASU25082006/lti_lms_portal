import mongoose, { Schema, Document, Model } from 'mongoose';

export type EnquiryStatus = 'NEW' | 'IN_REVIEW' | 'RESPONDED' | 'ARCHIVED';

export interface IContactEnquiry extends Document {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  courseInterest?: string;
  message: string;
  status: EnquiryStatus;
  adminNotes?: string;
  respondedBy?: mongoose.Types.ObjectId;
  respondedAt?: Date;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactEnquirySchema = new Schema<IContactEnquiry>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    courseInterest: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['NEW', 'IN_REVIEW', 'RESPONDED', 'ARCHIVED'],
      default: 'NEW',
      index: true,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

ContactEnquirySchema.index({ status: 1, createdAt: -1 });

export const ContactEnquiry: Model<IContactEnquiry> =
  mongoose.models.ContactEnquiry || mongoose.model<IContactEnquiry>('ContactEnquiry', ContactEnquirySchema);
export default ContactEnquiry;
