import { z } from 'zod';

// Common validation schemas
const hexColorSchema = z.string().regex(/^#[\da-f]{6}$/i, 'Invalid hex color format (e.g., #FF0000)');

const urlSchema = z.string().url('Invalid URL format').max(500, 'URL must not exceed 500 characters');

const domainSchema = z
  .string()
  .min(3, 'Domain must be at least 3 characters')
  .max(255, 'Domain must not exceed 255 characters')
  .regex(/^[\d.A-Za-z-]+\.[A-Za-z]{2,}$/, 'Invalid domain format');

const agencyCodeSchema = z
  .string()
  .min(2, 'Agency code must be at least 2 characters')
  .max(10, 'Agency code must not exceed 10 characters')
  .regex(/^[\dA-Z]+$/, 'Agency code must contain only uppercase letters and numbers')
  .transform((val) => val.toUpperCase());

const agencyNameSchema = z
  .string()
  .min(2, 'Agency name must be at least 2 characters')
  .max(100, 'Agency name must not exceed 100 characters')
  .trim()
  .regex(/^[\d\s&.A-Za-z-]+$/, 'Agency name contains invalid characters');

// Agency settings schema aligned with the model
const agencySettingsSchema = z
  .object({
    maxUsers: z
      .number()
      .int('Max users must be an integer')
      .min(1, 'Max users must be at least 1')
      .max(10_000, 'Max users cannot exceed 10,000')
      .default(100),
    allowedDomains: z
      .array(domainSchema)
      .min(0, 'At least one domain is required')
      .max(10, 'Cannot have more than 10 allowed domains')
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
      .min(1, 'Max users must be at least 1')
      .max(10_000, 'Max users cannot exceed 10,000'),
    allowedDomains: z
      .array(domainSchema)
      .min(0, 'At least one domain is required')
      .max(10, 'Cannot have more than 10 allowed domains'),
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
    .transform((val) => (val ? Number.parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 10)),
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
      return undefined;
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
