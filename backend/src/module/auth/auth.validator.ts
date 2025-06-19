import { z } from 'zod';

import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '../../shared/constant/validation';
import { createAgencySchema } from '../../module/agency/agency.validator'; // ✅ correct path adjust karo

// Magic numbers for validation
const EMAIL_MAX_LENGTH = 255;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 50;
const LOGIN_PASSWORD_MAX_LENGTH = PASSWORD_MAX_LENGTH;
const REFRESH_TOKEN_MAX_LENGTH = 500;
const TOKEN_MAX_LENGTH = 64;

const emailSchema = z
  .string()
  .email('Invalid email format')
  .toLowerCase()
  .trim()
  .max(EMAIL_MAX_LENGTH, `Email must not exceed ${EMAIL_MAX_LENGTH} characters`);

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must not exceed ${PASSWORD_MAX_LENGTH} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[^\dA-Za-z]/, 'Password must contain at least one special character');

const nameSchema = z
  .string()
  .min(NAME_MIN_LENGTH, `Name must be at least ${NAME_MIN_LENGTH} characters`)
  .max(NAME_MAX_LENGTH, `Name must not exceed ${NAME_MAX_LENGTH} characters`)
  .trim()
  .regex(/^[\sA-Za-z]+$/, 'Name can only contain letters and spaces');

const objectIdSchema = z.string().regex(/^[\dA-Fa-f]{24}$/, 'Invalid ObjectId format');

// Registration schema with comprehensive validation
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: objectIdSchema,
  agency: z.union([objectIdSchema, createAgencySchema]),
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(LOGIN_PASSWORD_MAX_LENGTH, `Password too long`),
});

// Password reset schema
export const passwordResetSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Refresh token schema
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token is required')
    .max(REFRESH_TOKEN_MAX_LENGTH, 'Invalid refresh token format'),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Email verification schema
export const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required').max(TOKEN_MAX_LENGTH, 'Invalid token format'),
});

// Parameters validation schemas
export const tokenParamSchema = z.object({
  token: z.string().min(1, 'Token is required').max(TOKEN_MAX_LENGTH, 'Invalid token format'),
});

// Export types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>;
export type TokenParamInput = z.infer<typeof tokenParamSchema>;
