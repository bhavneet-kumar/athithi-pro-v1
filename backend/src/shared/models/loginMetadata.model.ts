import crypto from 'node:crypto';

import bcrypt from 'bcryptjs';
import { Schema, model, Document, Types } from 'mongoose';
import { http } from 'winston';

import { BCRYPT_SALT_ROUNDS, CRYPTO_RANDOM_BYTES } from '../constant/encryption';
import { THIRTY_MINUTES_IN_MILLISECONDS, TWENTY_FOUR_HOURS_IN_MILLISECONDS } from '../constant/timeValues';

export interface ILoginMetadata extends Document {
  userId: Types.ObjectId;
  password: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  failedLoginAttempts: number;
  lastFailedLogin?: Date;
  accountLockedUntil?: Date;

  comparePassword(candidate: string): Promise<boolean>;
  generateEmailVerificationToken(): Promise<void>;
  generatePasswordResetToken(): Promise<void>;
}

const LoginMetadataSchema = new Schema<ILoginMetadata>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    password: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    failedLoginAttempts: { type: Number, default: 0 },
    lastFailedLogin: Date,
    accountLockedUntil: Date,
  },
  { timestamps: true },
);

// hash password on save
LoginMetadataSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

LoginMetadataSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

LoginMetadataSchema.methods.generateEmailVerificationToken = async function () {
  const token = crypto.randomBytes(CRYPTO_RANDOM_BYTES).toString('hex');
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + TWENTY_FOUR_HOURS_IN_MILLISECONDS);
  await this.save();
};

LoginMetadataSchema.methods.generatePasswordResetToken = async function () {
  const token = crypto.randomBytes(CRYPTO_RANDOM_BYTES).toString('hex');
  this.passwordResetToken = token;
  this.passwordResetExpires = new Date(Date.now() + THIRTY_MINUTES_IN_MILLISECONDS);
  await this.save();
};

export const LoginMetadata = model<ILoginMetadata>('LoginMetadata', LoginMetadataSchema);
