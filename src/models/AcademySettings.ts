import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAcademySettings extends Document {
  companyName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string; // e.g. #0f2744 (Navy)
  secondaryColor: string; // e.g. #1d4ed8 (Blue)
  accentColor: string; // e.g. #3b82f6 (Sky/Light Blue)
  contactEmail: string;
  contactPhone: string;
  address: string;
  certificateSignatoryName: string;
  certificateSignatoryTitle: string;
  certificateOrganizationSealUrl?: string;
  minAttendancePercentForCert: number;
  minQuizScorePercentForCert: number;
  requireAllAssignmentsPassed: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AcademySettingsSchema = new Schema<IAcademySettings>(
  {
    companyName: {
      type: String,
      default: 'Company Academy',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Professional Academy for Career Excellence & Applied Technology',
      trim: true,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    faviconUrl: {
      type: String,
      default: '',
    },
    primaryColor: {
      type: String,
      default: '#0f2744', // Navy
    },
    secondaryColor: {
      type: String,
      default: '#1d4ed8', // Royal Blue
    },
    accentColor: {
      type: String,
      default: '#3b82f6', // Light Blue
    },
    contactEmail: {
      type: String,
      default: 'admissions@companyacademy.com',
    },
    contactPhone: {
      type: String,
      default: '+1 (800) 555-0199',
    },
    address: {
      type: String,
      default: '100 Innovation Way, Suite 400, Tech City, CA 94105',
    },
    certificateSignatoryName: {
      type: String,
      default: 'Dr. Arthur Vance, Ph.D.',
    },
    certificateSignatoryTitle: {
      type: String,
      default: 'Dean of Academic Affairs, Company Academy',
    },
    certificateOrganizationSealUrl: {
      type: String,
      default: '',
    },
    minAttendancePercentForCert: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },
    minQuizScorePercentForCert: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    requireAllAssignmentsPassed: {
      type: Boolean,
      default: true,
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

export const AcademySettings: Model<IAcademySettings> =
  mongoose.models.AcademySettings || mongoose.model<IAcademySettings>('AcademySettings', AcademySettingsSchema);
export default AcademySettings;
