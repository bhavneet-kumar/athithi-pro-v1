import { z } from 'zod';

// Validation constants
const VALIDATION_LIMITS = {
  URL_MAX_LENGTH: 500,
  DOMAIN_MIN_LENGTH: 3,
  DOMAIN_MAX_LENGTH: 255,
  AGENCY_CODE_MIN_LENGTH: 2,
  AGENCY_CODE_MAX_LENGTH: 10,
  AGENCY_NAME_MIN_LENGTH: 2,
  AGENCY_NAME_MAX_LENGTH: 100,
  MAX_USERS_MIN: 1,
  MAX_USERS_MAX: 10_000,
  MAX_USERS_DEFAULT: 100,
  ALLOWED_DOMAINS_MAX: 10,
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
} as const;

// Common validation schemas
const hexColorSchema = z.string().regex(/^#[\da-f]{6}$/i, 'Invalid hex color format (e.g., #FF0000)');

const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(VALIDATION_LIMITS.URL_MAX_LENGTH, 'URL must not exceed 500 characters');

const domainSchema = z
  .string()
  .min(VALIDATION_LIMITS.DOMAIN_MIN_LENGTH, 'Domain must be at least 3 characters')
  .max(VALIDATION_LIMITS.DOMAIN_MAX_LENGTH, 'Domain must not exceed 255 characters')
  .regex(/^[\d.A-Za-z-]+\.[A-Za-z]{2,}$/, 'Invalid domain format');

const agencyCodeSchema = z
  .string()
  .min(VALIDATION_LIMITS.AGENCY_CODE_MIN_LENGTH, 'Agency code must be at least 2 characters')
  .max(VALIDATION_LIMITS.AGENCY_CODE_MAX_LENGTH, 'Agency code must not exceed 10 characters')
  .regex(/^[\dA-Z]+$/, 'Agency code must contain only uppercase letters and numbers')
  .transform((val) => val.toUpperCase());

const agencyNameSchema = z
  .string()
  .min(VALIDATION_LIMITS.AGENCY_NAME_MIN_LENGTH, 'Agency name must be at least 2 characters')
  .max(VALIDATION_LIMITS.AGENCY_NAME_MAX_LENGTH, 'Agency name must not exceed 100 characters')
  .trim()
  .regex(/^[\d\s&.A-Za-z-]+$/, 'Agency name contains invalid characters');

// Agency settings schema aligned with the model
const agencySettingsSchema = z
  .object({
    maxUsers: z
      .number()
      .int('Max users must be an integer')
      .min(VALIDATION_LIMITS.MAX_USERS_MIN, 'Max users must be at least 1')
      .max(VALIDATION_LIMITS.MAX_USERS_MAX, 'Max users cannot exceed 10,000')
      .default(VALIDATION_LIMITS.MAX_USERS_DEFAULT),
    allowedDomains: z
      .array(domainSchema)
      .min(0, 'At least one domain is required')
      .max(VALIDATION_LIMITS.ALLOWED_DOMAINS_MAX, 'Cannot have more than 10 allowed domains')
      .default([]),
    customBranding: z
      .object({
        logo: urlSchema.optional(),
        colors: z
          .object({
            primary: hexColorSchema,
            secondary: hexColorSchema,
          })
          .optional(),
      })
      .optional(),
  })
  .optional();

// Create agency schema
export const createAgencySchema = z.object({
  name: agencyNameSchema,
  code: agencyCodeSchema,
  domain: domainSchema,
  settings: agencySettingsSchema,
});

// Update agency schema (all fields optional)
export const updateAgencySchema = z.object({
  name: agencyNameSchema.optional(),
  code: agencyCodeSchema.optional(),
  domain: domainSchema.optional(),
  settings: agencySettingsSchema,
  isActive: z.boolean().optional(),
});

// Agency settings update schema
export const updateAgencySettingsSchema = z.object({
  settings: z.object({
    maxUsers: z
      .number()
      .int('Max users must be an integer')
      .min(VALIDATION_LIMITS.MAX_USERS_MIN, 'Max users must be at least 1')
      .max(VALIDATION_LIMITS.MAX_USERS_MAX, 'Max users cannot exceed 10,000'),
    allowedDomains: z
      .array(domainSchema)
      .min(0, 'At least one domain is required')
      .max(VALIDATION_LIMITS.ALLOWED_DOMAINS_MAX, 'Cannot have more than 10 allowed domains'),
    customBranding: z
      .object({
        logo: urlSchema.optional(),
        colors: z
          .object({
            primary: hexColorSchema,
            secondary: hexColorSchema,
          })
          .optional(),
      })
      .optional(),
  }),
});

// Query parameters schema for listing agencies
export const listAgenciesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, VALIDATION_LIMITS.DEFAULT_LIMIT) : VALIDATION_LIMITS.DEFAULT_PAGE)),
  limit: z
    .string()
    .optional()
    .transform((val) =>
      val ? Number.parseInt(val, VALIDATION_LIMITS.DEFAULT_LIMIT) : VALIDATION_LIMITS.DEFAULT_LIMIT,
    ),
  search: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') {
        return true;
      }
      if (val === 'false') {
        return false;
      }
      return null;
    }),
  sort: z.enum(['name', 'code', 'createdAt', 'updatedAt']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Parameter validation schemas
export const agencyIdParamSchema = z.object({
  agencyId: z
    .string()
    .regex(/^[\dA-Fa-f]{24}$/, 'Invalid agency ID format')
    .describe('Agency MongoDB ObjectId'),
});

export const agencyCodeParamSchema = z.object({
  code: agencyCodeSchema.describe('Agency code'),
});

// Export types
export type CreateAgencyInput = z.infer<typeof createAgencySchema>;
export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>;
export type UpdateAgencySettingsInput = z.infer<typeof updateAgencySettingsSchema>;
export type ListAgenciesQuery = z.infer<typeof listAgenciesQuerySchema>;
export type AgencyIdParam = z.infer<typeof agencyIdParamSchema>;
export type AgencyCodeParam = z.infer<typeof agencyCodeParamSchema>;
