import { Document, Schema, Types, model } from 'mongoose';

import { LeadSource, LeadStatus } from '../../types/enum/lead';

export interface ILead extends Document {
  agencyId: Types.ObjectId;
  leadNumber: string;
  fullName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  dateOfBirth?: Date;
  gender?: string;
  occupation?: string;
  company?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  status: LeadStatus;
  source: LeadSource;
  priority: string;
  assignedTo?: Types.ObjectId;
  travelDetails?: {
    destination: string;
    departureDate: Date;
    returnDate: Date;
    travelers?: {
      adults: number;
      children: number;
      infants: number;
    };
    budget: {
      min?: number;
      max?: number;
      value: number;
      currency: string;
    };
    packageType?: string;
    preferences: {
      accommodation: string;
      transport?: string;
      mealPreference?: string;
      specialRequests: string;
      preferredActivities?: string;
    };
  };
  aiScore: {
    value: number;
    lastCalculated: Date;
    factors?: {
      budget: number;
      timeline: number;
      engagement: number;
      profile: number;
      behavior: number;
    };
  };
  engagement?: {
    totalInteractions: number;
    lastInteraction: Date;
    emailOpens: number;
    emailClicks: number;
    websiteVisits: number;
    callsReceived: number;
    callsMade: number;
  };
  tags?: string[];
  notes?: string;
  duplicateKey?: string;
  leadCount?: number;
  originalLeadId?: Types.ObjectId;
  nextFollowUp?: Date;
  followUpReason?: string;
  audit: {
    createdAt: Date;
    createdBy: Types.ObjectId;
    updatedAt: Date;
    updatedBy: Types.ObjectId;
    version: number;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: Types.ObjectId;
  };
}

const leadSchema = new Schema<ILead>(
  {
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: 'Agency',
      required: true,
    },
    leadNumber: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },
    dateOfBirth: Date,
    gender: String,
    occupation: String,
    company: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(LeadStatus),
    },
    source: {
      type: String,
      required: true,
      enum: Object.values(LeadSource),
    },
    priority: {
      type: String,
      required: false,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    travelDetails: {
      destination: String,
      departureDate: Date,
      returnDate: Date,
      travelers: {
        adults: Number,
        children: Number,
        infants: Number,
      },
      budget: {
        min: Number,
        max: Number,
        currency: String,
      },
      packageType: String,
      preferences: {
        accommodation: String,
        transport: String,
        mealPreference: String,
        specialRequests: String,
        preferredActivities: String,
      },
    },
    aiScore: {
      value: Number,
      lastCalculated: Date,
      factors: {
        budget: Number,
        timeline: Number,
        engagement: Number,
        profile: Number,
        behavior: Number,
      },
    },
    engagement: {
      totalInteractions: Number,
      lastInteraction: Date,
      emailOpens: Number,
      emailClicks: Number,
      websiteVisits: Number,
      callsReceived: Number,
      callsMade: Number,
    },
    tags: [String],
    notes: String,
    duplicateKey: String,
    leadCount: Number,
    originalLeadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
    },
    nextFollowUp: Date,
    followUpReason: String,
    audit: {
      createdAt: {
        type: Date,
        default: Date.now,
      },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
      updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      version: {
        type: Number,
        default: 1,
      },
      isDeleted: {
        type: Boolean,
        default: false,
      },
      deletedAt: Date,
      deletedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  },
  {
    timestamps: true,
  },
);

// Add a text index for search functionality
leadSchema.index({
  fullName: 'text',
  email: 'text',
  phone: 'text',
  // company: 'text',
  // 'address.street': 'text',
  // 'address.city': 'text',
  // 'address.state': 'text',
  // 'address.country': 'text',
  tags: 'text',
  notes: 'text',
});

// Compound index to ensure unique lead number per agency
leadSchema.index({ agencyId: 1, leadNumber: 1 }, { unique: true });

export const Lead = model<ILead>('Lead', leadSchema);
