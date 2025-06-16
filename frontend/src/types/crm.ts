import { z } from 'zod';

// Enums
export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  BOOKED = 'booked',
  LOST = 'lost',
}

export enum LeadSource {
  WEBSITE = 'website',
  REFERRAL = 'referral',
  SOCIAL = 'social',
  EMAIL = 'email',
  PHONE = 'phone',
  WHATSAPP = 'whatsapp',
  MARKETPLACE = 'marketplace',
  OTHER = 'other',
}

export enum TaskType {
  CALL = 'call',
  EMAIL = 'email',
  MEETING = 'meeting',
  DOCUMENT = 'document',
  FOLLOW_UP = 'follow_up',
  OTHER = 'other',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum CommunicationChannel {
  EMAIL = 'email',
  PHONE = 'phone',
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  IN_PERSON = 'in_person',
  OTHER = 'other',
}

// Schemas
export const LeadSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.nativeEnum(LeadStatus).default(LeadStatus.NEW),
  source: z.nativeEnum(LeadSource),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  budget: z.number().optional(),
  travelDates: z
    .object({
      start: z.date().or(z.string()).optional(),
      end: z.date().or(z.string()).optional(),
    })
    .optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
  assignedTo: z.string().optional(),
  collaborators: z.array(z.string()).default([]),
  aiPriorityScore: z.number().min(0).max(1).default(0.5),
  preferences: z.record(z.string()).optional(),
  isReturnCustomer: z.boolean().default(false),
  previousBookings: z.array(z.string()).optional(),
});

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.nativeEnum(TaskType),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.date().or(z.string()),
  completed: z.boolean().default(false),
  completedAt: z.date().or(z.string()).optional(),
  leadId: z.string().optional(),
  assignedTo: z.string(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export const CommunicationSchema = z.object({
  id: z.string(),
  leadId: z.string(),
  channel: z.nativeEnum(CommunicationChannel),
  direction: z.enum(['incoming', 'outgoing']),
  content: z.string(),
  sentAt: z.date().or(z.string()),
  sentBy: z.string(),
  attachments: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        url: z.string(),
        type: z.string(),
      })
    )
    .optional(),
  metadata: z.record(z.any()).optional(),
  aiSentiment: z.number().min(-1).max(1).optional(),
});

export const BookingSchema = z.object({
  id: z.string(),
  leadId: z.string(),
  status: z.enum(['draft', 'confirmed', 'paid', 'completed', 'cancelled']),
  itinerary: z
    .object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      startDate: z.date().or(z.string()).optional(),
      endDate: z.date().or(z.string()).optional(),
    })
    .optional(),
  totalAmount: z.number(),
  paidAmount: z.number().default(0),
  paymentStages: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        amount: z.number(),
        dueDate: z.date().or(z.string()),
        paid: z.boolean().default(false),
        paidAt: z.date().or(z.string()).optional(),
      })
    )
    .optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

// Types derived from schemas
export type Lead = z.infer<typeof LeadSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Communication = z.infer<typeof CommunicationSchema>;
export type Booking = z.infer<typeof BookingSchema>;

// AI-related types
export interface LeadSuggestion {
  priorityScore: number;
  priorityFactors?: Record<string, number>;
  nextAction?: string;
  replyTemplate?: string;
  tags?: string[];
}

export interface AiInsight {
  type: 'suggestion' | 'alert' | 'report';
  title: string;
  description: string;
  data?: Record<string, unknown>;
  createdAt: Date;
}

export interface LeadCohort {
  id: string;
  name: string;
  description?: string;
  leadIds: string[];
  tags: string[];
  createdAt: Date;
}
