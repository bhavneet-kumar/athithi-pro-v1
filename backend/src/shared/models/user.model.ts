import crypto from 'node:crypto';

import { Schema, model, Document, Types } from 'mongoose';

import { CRYPTO_RANDOM_BYTES } from '../constant/encryption';
import { THIRTY_MINUTES_IN_MILLISECONDS, TWENTY_FOUR_HOURS_IN_MILLISECONDS } from '../constant/timeValues';

export interface IUser extends Document {
  email: string;
  // password: string;
  firstName: string;
  lastName: string;
  agency: Types.ObjectId;
  role: Types.ObjectId;
  isActive: boolean;
  parentId?: Types.ObjectId | null;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  failedLoginAttempts: number;
  lastFailedLogin?: Date;
  accountLockedUntil?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateEmailVerificationToken(): Promise<void>;
  generatePasswordResetToken(): Promise<void>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    agency: {
      type: Schema.Types.ObjectId,
      ref: 'Agency',
      required: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to ensure unique email per agency
userSchema.index({ agency: 1, email: 1 }, { unique: true });

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = async function (): Promise<void> {
  const token = crypto.randomBytes(CRYPTO_RANDOM_BYTES).toString('hex');
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + TWENTY_FOUR_HOURS_IN_MILLISECONDS); // 24 hours
  await this.save();
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = async function (): Promise<void> {
  const token = crypto.randomBytes(CRYPTO_RANDOM_BYTES).toString('hex');
  this.passwordResetToken = token;
  this.passwordResetExpires = new Date(Date.now() + THIRTY_MINUTES_IN_MILLISECONDS); // 30 minutes
  await this.save();
};

export const User = model<IUser>('User', userSchema);
