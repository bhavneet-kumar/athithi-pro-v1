import { ObjectId, Document } from 'mongodb';

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export interface Travelers {
  adults?: number;
  children?: number;
  infants?: number;
}

export interface Budget {
  min?: number;
  max?: number;
  currency?: string;
}

export interface Preferences {
  accommodation?: string;
  transport?: string;
  mealPreference?: string;
  specialRequests?: string;
}

export interface TravelDetails {
  destination?: string;
  departureDate?: Date;
  returnDate?: Date;
  travelers?: Travelers;
  budget?: Budget;
  packageType?: string; // e.g., "honeymoon", "family", etc.
  preferences?: Preferences;
}

export interface AiScore {
  value?: number;
  lastCalculated?: Date;
  factors?: {
    budget?: number;
    timeline?: number;
    engagement?: number;
    profile?: number;
    behavior?: number;
  };
}

export interface Engagement {
  totalInteractions?: number;
  lastInteraction?: Date;
  emailOpens?: number;
  emailClicks?: number;
  websiteVisits?: number;
  callsReceived?: number;
  callsMade?: number;
}

export interface ILead extends Document {
  agencyId: ObjectId;
  leadNumber: string;

  // Personal Information
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  dateOfBirth?: Date;
  gender?: string;
  occupation?: string;
  company?: string;

  // Address Information
  address?: Address;

  // Lead Management
  status?: string;
  source?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: ObjectId;

  // Travel Specific
  travelDetails?: TravelDetails;

  // AI Scoring
  aiScore?: AiScore;

  // Engagement Tracking
  engagement?: Engagement;

  // Tags and Notes
  tags?: string[];
  notes?: string;

  // Duplicate Detection
  duplicateKey?: string;
  leadCount?: number;
  originalLeadId?: ObjectId;

  // Follow-up Tracking
  nextFollowUp?: Date;
  followUpReason?: string;

  // Audit fields (assumed from "...auditSchema")
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: ObjectId;
  updatedBy?: ObjectId;
}

export interface CreateLeadInput {
  agencyId: ObjectId;
  leadNumber: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  alternatePhone?: string;
}