import { z } from 'zod';

import { LeadSource, LeadStatus } from '../../types/enum/lead';

const MAX_SCORE = 100;
const MIN_SCORE = 0;

const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  pincode: z.string().min(1, 'Pincode is required'),
});

const travelersSchema = z
  .object({
    adults: z.number().min(0, 'Adults count must be 0 or greater'),
    children: z.number().min(0, 'Children count must be 0 or greater'),
    infants: z.number().min(0, 'Infants count must be 0 or greater'),
  })
  .optional();

const budgetSchema = z.object({
  min: z.number().min(0, 'Minimum budget must be 0 or greater').optional(),
  max: z.number().min(0, 'Maximum budget must be 0 or greater').optional(),
  value: z.number().min(0, 'Budget value must be 0 or greater'),
  currency: z.string().min(1, 'Currency is required'),
});

const preferencesSchema = z.object({
  accommodation: z.string().optional(),
  transport: z.string().optional(),
  mealPreference: z.string().optional(),
  specialRequests: z.string().optional(),
});

const travelDetailsSchema = z
  .object({
    destination: z.string().min(1, 'Destination is required'),
    departureDate: z.string().transform((str) => new Date(str)),
    returnDate: z.string().transform((str) => new Date(str)),
    travelers: travelersSchema,
    budget: budgetSchema,
    packageType: z.string().optional(),
    preferences: preferencesSchema,
  })
  .optional();

const aiScoreFactorsSchema = z
  .object({
    budget: z.number().min(MIN_SCORE).max(MAX_SCORE),
    timeline: z.number().min(MIN_SCORE).max(MAX_SCORE),
    engagement: z.number().min(MIN_SCORE).max(MAX_SCORE),
    profile: z.number().min(MIN_SCORE).max(MAX_SCORE),
    behavior: z.number().min(MIN_SCORE).max(MAX_SCORE),
  })
  .optional();

const aiScoreSchema = z.object({
  value: z.number().min(MIN_SCORE).max(MAX_SCORE),
  lastCalculated: z.string().transform((str) => new Date(str)),
  factors: aiScoreFactorsSchema,
});

const engagementSchema = z
  .object({
    totalInteractions: z.number().min(0),
    lastInteraction: z.string().transform((str) => new Date(str)),
    emailOpens: z.number().min(0),
    emailClicks: z.number().min(0),
    websiteVisits: z.number().min(0),
    callsReceived: z.number().min(0),
    callsMade: z.number().min(0),
  })
  .optional();

// MongoDB ObjectId validation
const objectIdSchema = z.string().regex(/^[\dA-Fa-f]{24}$/, 'Invalid ObjectId format');

export const leadValidator = {
  createSchema: z.object({
    agencyId: objectIdSchema.optional(),
    leadNumber: z.string().min(1, 'Lead number is required'),
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email format'),
    phone: z.string().min(1, 'Phone number is required'),
    alternatePhone: z.string().optional(),
    dateOfBirth: z
      .string()
      .transform((str) => new Date(str))
      .optional(),
    gender: z.string().optional(),
    occupation: z.string().optional(),
    company: z.string().optional(),
    address: addressSchema.optional(),
    status: z.nativeEnum(LeadStatus),
    source: z.nativeEnum(LeadSource),
    priority: z.string().optional(),
    assignedTo: objectIdSchema.optional(),
    travelDetails: travelDetailsSchema,
    aiScore: aiScoreSchema,
    engagement: engagementSchema,
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
    nextFollowUp: z
      .string()
      .transform((str) => new Date(str))
      .optional(),
    followUpReason: z.string().optional(),
    audit: z.object({
      createdBy: objectIdSchema,
      updatedBy: objectIdSchema,
    }),
  }),

  updateSchema: z.object({
    agencyId: objectIdSchema.optional(),
    fullName: z.string().min(1, 'Full name is required').optional(),
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().min(1, 'Phone number is required').optional(),
    alternatePhone: z.string().optional(),
    dateOfBirth: z
      .string()
      .transform((str) => new Date(str))
      .optional(),
    gender: z.string().optional(),
    occupation: z.string().optional(),
    company: z.string().optional(),
    address: addressSchema.optional(),
    status: z.nativeEnum(LeadStatus),
    source: z.nativeEnum(LeadSource),
    priority: z.string().optional(),
    assignedTo: objectIdSchema.optional(),
    travelDetails: travelDetailsSchema,
    aiScore: aiScoreSchema.optional(),
    engagement: engagementSchema,
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
    nextFollowUp: z
      .string()
      .transform((str) => new Date(str))
      .optional(),
    followUpReason: z.string().optional(),
  }),

  filterSchema: z.object({
    agencyId: objectIdSchema.optional(),
    search: z.string().optional(),
    status: z.nativeEnum(LeadStatus).optional(),
    source: z.nativeEnum(LeadSource).optional(),
    priority: z.string().optional(),
    assignedTo: objectIdSchema.optional(),
    tags: z.array(z.string()).optional(),
    startDate: z
      .string()
      .transform((str) => new Date(str))
      .optional(),
    endDate: z
      .string()
      .transform((str) => new Date(str))
      .optional(),
    page: z.number().min(1).optional(),
    limit: z.number().min(1).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),

  idSchema: z.object({
    id: objectIdSchema,
    agencyId: objectIdSchema.optional(),
  }),

  changeStatusSchema: z.object({
    status: z.nativeEnum(LeadStatus),
  }),
};
