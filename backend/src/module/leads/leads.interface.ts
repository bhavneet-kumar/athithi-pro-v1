import { Types } from 'mongoose';
import { ILead } from '../../shared/models/leads.model';

export interface ILeadCreate extends ILead {
  agencyId: Types.ObjectId;
  assignedTo?: Types.ObjectId;
}

export interface ILeadUpdate extends Partial<ILeadCreate> {
  id: string;
}

export interface ILeadFilter {
  agencyId: Types.ObjectId;
  search?: string;
  status?: string;
  source?: string;
  priority?: string;
  assignedTo?: string;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ILeadResponse {
  id: string;
  leadNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  priority: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeadDetailResponse extends ILeadResponse {
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
  travelDetails?: {
    destination: string;
    departureDate: Date;
    returnDate: Date;
    travelers: {
      adults: number;
      children: number;
      infants: number;
    };
    budget: {
      min: number;
      max: number;
      currency: string;
    };
    packageType: string;
    preferences: {
      accommodation: string;
      transport: string;
      mealPreference: string;
      specialRequests: string;
    };
  };
  aiScore?: {
    value: number;
    lastCalculated: Date;
    factors: {
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
  nextFollowUp?: Date;
  followUpReason?: string;
  audit: {
    createdAt: Date;
    createdBy: string;
    updatedAt: Date;
    updatedBy: string;
    version: number;
  };
}