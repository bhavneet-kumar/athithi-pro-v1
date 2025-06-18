import { Schema, model, Document } from 'mongoose';

export interface IAgency extends Document {
  name: string;
  code: string;
  domain: string;
  isActive: boolean;
  settings: {
    maxUsers: number;
    allowedDomains: string[];
    customBranding?: {
      logo?: string;
      colors?: {
        primary: string;
        secondary: string;
      };
    };
  };
}

const agencySchema = new Schema<IAgency>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    domain: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      maxUsers: {
        type: Number,
        default: 100,
      },
      allowedDomains: [
        {
          type: String,
          trim: true,
        },
      ],
      customBranding: {
        logo: String,
        colors: {
          primary: String,
          secondary: String,
        },
      },
    },
  },
  {
    timestamps: true,
  },
);

export const Agency = model<IAgency>('Agency', agencySchema);
