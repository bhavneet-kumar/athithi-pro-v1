import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILead extends Document {
  agencyId: Types.ObjectId;
  leadNumber: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  dateOfBirth?: Date;
  gender?: string;
  occupation?: string;
  company?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  status?: string;
  source?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: Types.ObjectId;
  travelDetails?: {
    destination?: string;
    departureDate?: Date;
    returnDate?: Date;
    travelers?: {
      adults?: number;
      children?: number;
      infants?: number;
    };
    budget?: {
      min?: number;
      max?: number;
      currency?: string;
    };
    packageType?: string;
    preferences?: {
      accommodation?: string;
      transport?: string;
      mealPreference?: string;
      specialRequests?: string;
    };
  };
  aiScore?: {
    value?: number;
    lastCalculated?: Date;
    factors?: {
      budget?: number;
      timeline?: number;
      engagement?: number;
      profile?: number;
      behavior?: number;
    };
  };
  engagement?: {
    totalInteractions?: number;
    lastInteraction?: Date;
    emailOpens?: number;
    emailClicks?: number;
    websiteVisits?: number;
    callsReceived?: number;
    callsMade?: number;
  };
  tags?: string[];
  notes?: string;
  duplicateKey?: string;
  leadCount?: number;
  originalLeadId?: Types.ObjectId;
  nextFollowUp?: Date;
  followUpReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const leadSchema = new Schema<ILead>(
  {
    agencyId: { type: Schema.Types.ObjectId, ref: 'agencies', index: true },
    leadNumber: String,

    firstName: { type: String, index: true },
    lastName: { type: String, index: true },
    email: { type: String, index: true },
    phone: { type: String, index: true },
    alternatePhone: String,
    dateOfBirth: Date,
    gender: String,
    occupation: String,
    company: String,

    address: {
      street: String,
      city: { type: String, index: true },
      state: { type: String, index: true },
      country: { type: String, index: true },
      pincode: String,
    },

    status: { type: String, index: true },
    source: { type: String, index: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'users', index: true },

    travelDetails: {
      destination: { type: String, index: true },
      departureDate: { type: Date, index: true },
      returnDate: { type: Date, index: true },
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
      },
    },

    aiScore: {
      value: { type: Number, min: 0, max: 100, index: true },
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
      totalInteractions: { type: Number, default: 0 },
      lastInteraction: Date,
      emailOpens: { type: Number, default: 0 },
      emailClicks: { type: Number, default: 0 },
      websiteVisits: { type: Number, default: 0 },
      callsReceived: { type: Number, default: 0 },
      callsMade: { type: Number, default: 0 },
    },

    tags: [{ type: String, index: true }],
    notes: String,

    duplicateKey: { type: String, index: true },
    leadCount: { type: Number, default: 1 },
    originalLeadId: { type: Schema.Types.ObjectId, ref: 'leads', sparse: true },

    nextFollowUp: { type: Date, index: true },
    followUpReason: String,
  },
  { timestamps: true },
);

// Compound index to ensure unique lead number per agency
leadSchema.index({ agencyId: 1, leadNumber: 1 }, { unique: true });

// Add a text index for search functionality
leadSchema.index({
  firstName: 'text',
  lastName: 'text',
  email: 'text',
  phone: 'text',
  company: 'text',
  'address.street': 'text',
  'address.city': 'text',
  'address.state': 'text',
  'address.country': 'text',
  tags: 'text',
  notes: 'text',
});

export const Lead = mongoose.model<ILead>('Lead', leadSchema);
