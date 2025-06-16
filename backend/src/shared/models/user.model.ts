import crypto from 'node:crypto';

import bcrypt from 'bcryptjs';
import { Schema, model, Document, Types } from 'mongoose';

import { BCRYPT_SALT_ROUNDS, CRYPTO_RANDOM_BYTES } from '../constant/encryption';
import { THIRTY_MINUTES_IN_MILLISECONDS, TWENTY_FOUR_HOURS_IN_MILLISECONDS } from '../constant/timeValues';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  agency: Types.ObjectId;
  role: Types.ObjectId;
  isActive: boolean;
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
    password: {
      type: String,
      required: true,
      minlength: 6,
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
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lastFailedLogin: Date,
    accountLockedUntil: Date,
  },
  {
    timestamps: true,
  },
);

// Compound index to ensure unique email per agency
userSchema.index({ agency: 1, email: 1 }, { unique: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

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
