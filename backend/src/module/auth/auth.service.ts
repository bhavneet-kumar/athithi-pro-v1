import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import mongoose, { Types, isValidObjectId } from 'mongoose';
import { ZodError } from 'zod';

import { config } from '../../shared/config/index';
import {
  LOGIN_RATE_LIMITER_TIME,
  MINUTES_IN_MILLISECONDS,
  THIRTY_MINUTES_IN_MILLISECONDS,
  TWENTY_FOUR_HOURS_IN_MILLISECONDS,
} from '../../shared/constant/timeValues';
import { MAX_LOGIN_ATTEMPTS } from '../../shared/constant/validation';
import { Agency } from '../../shared/models/agency.model';
import { ILoginMetadata, LoginMetadata } from '../../shared/models/loginMetadata.model';
import { Role } from '../../shared/models/role.model';
import { User, IUser } from '../../shared/models/user.model';
import { BaseService } from '../../shared/services/base.service';
import { emailService } from '../../shared/services/email.service';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  BusinessError,
  InternalServerError,
  CustomError,
  NotFoundError,
} from '../../shared/utils/customError';
import { IAgency } from '../agency/agency.interface';
import { agencyService } from '../agency/agency.service';
import { createAgencySchema } from '../agency/agency.validator';

import { ILoginInput, IRegisterInput, IPasswordResetInput, IRefreshTokenInput, ILoginResponse } from './auth.interface';

export class AuthService extends BaseService<IUser> {
  private readonly tokenOptions: SignOptions = {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    algorithm: 'RS256',
  };

  private readonly refreshTokenOptions: SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    algorithm: 'RS256',
  };

  // Constants for business rules
  private readonly MAX_LOGIN_ATTEMPTS = MAX_LOGIN_ATTEMPTS;
  private readonly ACCOUNT_LOCK_TIME = LOGIN_RATE_LIMITER_TIME; // 15 minutes
  private readonly EMAIL_VERIFICATION_EXPIRY = TWENTY_FOUR_HOURS_IN_MILLISECONDS; // 24 hours
  private readonly PASSWORD_RESET_EXPIRY = THIRTY_MINUTES_IN_MILLISECONDS; // 30 minutes

  constructor() {
    super(User, 'User');
  }

  async register(data: IRegisterInput): Promise<{ user: IUser; token: string; metaInfo: ILoginMetadata }> {
    try {
      await this.ensureUserNotExists(data.email);
      const agencyId = await this.resolveAgency(data.agency as IAgency);
      const roleId = await this.determineRoleId(data.role, agencyId, data.agency);
      const parentId = await this.findParentId(data.agency, agencyId, roleId);
      const user = await this.createUserRecord(data, agencyId, roleId, parentId);
      const { token, metaInfo } = await this.createAndSendVerification(user, data.password);
      return { user, token, metaInfo };
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestError(`Invalid agency data: ${error.errors.map((e) => e.message).join(', ')}`);
      }
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Registration failed: ${error.message}`);
    }
  }

  private async ensureUserNotExists(email: string): Promise<void> {
    const existing = await this.checkIfUserExists(email);
    if (existing) {
      throw new BusinessError(`User already exists in agency: ${existing.agencyName} (ID: ${existing.agencyId})`);
    }
  }

  private async determineRoleId(
    roleInput: string | Types.ObjectId,
    agencyId: Types.ObjectId,
    agencyRaw: unknown,
  ): Promise<Types.ObjectId> {
    const isNewAgency = typeof agencyRaw === 'object' && agencyRaw !== null;
    return isNewAgency
      ? await this.resolveSuperAdminRoleId(agencyId)
      : this.resolveGivenRole(roleInput as string | Types.ObjectId);
  }

  private async findParentId(
    agencyRaw: unknown,
    agencyId: Types.ObjectId,
    _roleId: Types.ObjectId, // 🛠 underscore added
  ): Promise<Types.ObjectId | null> {
    const isNewAgency = typeof agencyRaw === 'object' && agencyRaw !== null;
    if (isNewAgency) {
      return null;
    }

    const superAdminRole = await Role.findOne({ agency: agencyId, name: 'Super Admin' });
    if (!superAdminRole) {
      throw new NotFoundError('Super Admin role not found for this agency');
    }

    const superAdminUser = await User.findOne({ agency: agencyId, role: superAdminRole._id });
    return superAdminUser ? (superAdminUser._id as Types.ObjectId) : null;
  }

  private async createUserRecord(
    data: IRegisterInput,
    agencyId: Types.ObjectId,
    roleId: Types.ObjectId,
    parentId: Types.ObjectId | null,
  ): Promise<IUser> {
    const user = new User({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: roleId,
      agency: agencyId,
      parentId,
    });
    await user.save();
    return user;
  }

  private async checkIfUserExists(email: string): Promise<{ agencyName: string; agencyId: string } | null> {
    const existingUser = await User.findOne({ email: { $eq: email } })
      .populate<{ agency: { _id: Types.ObjectId; name: string } }>('agency')
      .lean();

    if (!existingUser) {
      return null;
    }

    const agencyName = existingUser.agency?.name || 'Unknown Agency';
    const agencyId = existingUser.agency?._id?.toString() || 'Unknown ID';

    return { agencyName, agencyId };
  }

  private async resolveAgency(agency: IAgency | string): Promise<Types.ObjectId> {
    if (agency && typeof agency === 'object') {
      const validatedAgency = createAgencySchema.parse(agency);
      const createdAgency = await agencyService.createAgency(validatedAgency);
      return createdAgency._id as Types.ObjectId;
    } else if (agency) {
      if (!isValidObjectId(agency)) {
        throw new BadRequestError('Invalid agency ID format');
      }
      const existingAgency = await Agency.findOne({ _id: { $eq: agency } });
      if (!existingAgency) {
        throw new BadRequestError('Invalid agency provided');
      }
      return existingAgency._id as Types.ObjectId;
    }
    throw new BadRequestError('Agency is required');
  }

  private resolveGivenRole(roleId: string | Types.ObjectId): Types.ObjectId {
    if (!isValidObjectId(roleId)) {
      throw new BadRequestError('Invalid role ID format');
    }
    return new mongoose.Types.ObjectId(roleId);
  }

  private async resolveSuperAdminRoleId(agencyId: string | Types.ObjectId): Promise<Types.ObjectId> {
    const objectId = new mongoose.Types.ObjectId(agencyId);
    const role = await Role.findOne({
      name: 'Super Admin',
      agency: objectId,
    });

    if (!role) {
      throw new NotFoundError(`Super Admin role not found for agency ${agencyId}`);
    }

    return role._id as Types.ObjectId;
  }

  private async createAndSendVerification(
    user: IUser,
    password: string,
  ): Promise<{ metadata: ILoginMetadata; token: string; metaInfo: ILoginMetadata }> {
    try {
      const metadata = new LoginMetadata({ userId: user._id, password });
      await metadata.generateEmailVerificationToken();
      const token = metadata.emailVerificationToken;
      const metaInfo = await metadata.save();
      try {
        emailService.sendVerificationEmail(user.email, token);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
      return { metadata, token, metaInfo };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Email verification failed: ${error.message}`);
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const metadata = await LoginMetadata.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() },
      });

      if (!metadata) {
        throw new BadRequestError('Invalid or expired verification token');
      }

      await LoginMetadata.updateOne(
        { _id: metadata._id },
        {
          $set: { isEmailVerified: true },
          $unset: {
            emailVerificationToken: '',
            emailVerificationExpires: '',
          },
        },
      );
      await metadata.save();
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Email verification failed: ${error.message}`);
    }
  }

  async login(data: ILoginInput): Promise<ILoginResponse> {
    try {
      const user = await this.findOne({ email: data.email });
      if (!user) {
        throw new UnauthorizedError('Users Does not exist');
      }

      console.log(user, '++++++++++++++');
      const metadata = await LoginMetadata.findOne({ userId: user._id });
      if (!metadata) {
        throw new UnauthorizedError('Users login metadata does not exist');
      }

      console.log(metadata, '++++++++++++++');
      this.checkAccountLockStatus(metadata, user);

      console.log(user, 'here', '++++++++++++++');
      await this.verifyUserPassword(user, data.password, metadata);

      console.log(metadata, '++++++++++++++');
      await this.resetFailedLoginAttempts(metadata);

      const tokens = this.generateTokens(user.id.toString());

      return this.buildLoginResponse(tokens, user);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Login failed: ${error.message}`);
    }
  }

  /**
   * Checks if the account is locked based on metadata or user fields.
   * Throws ForbiddenError if locked.
   * @param metadata The login metadata object to check the account lock status for
   * @param user The user object to check the account lock status for
   * @throws ForbiddenError if the account is locked
   */
  private checkAccountLockStatus(metadata: ILoginMetadata, user: IUser): void {
    if (metadata.accountLockedUntil && metadata.accountLockedUntil > new Date()) {
      const lockMins = Math.ceil((metadata.accountLockedUntil.getTime() - Date.now()) / MINUTES_IN_MILLISECONDS);
      throw new ForbiddenError(`Account is locked. Try again in ${lockMins} minutes.`);
    }

    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const lockTimeRemaining = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / MINUTES_IN_MILLISECONDS);
      throw new ForbiddenError(`Account is locked. Please try again in ${lockTimeRemaining} minutes.`);
    }
  }

  /**
   * Verifies the user's password. Handles failed login attempts.
   * Throws UnauthorizedError if password is invalid.
   * @param user The user object to verify the password for
   * @param password The password to verify
   * @param metadata The login metadata object to handle the failed login attempts for
   * @throws UnauthorizedError if the password is invalid
   */
  private async verifyUserPassword(user: IUser, password: string, metadata: ILoginMetadata): Promise<void> {
    const isMatch = await metadata.comparePassword(password);
    if (!isMatch) {
      await this.handleFailedLogin(metadata);
      throw new UnauthorizedError('Invalid credentials');
    }
  }

  /**
   * Builds the login response object.
   * @param tokens The tokens to build the login response object for
   * @param tokens.token The token to build the login response object for
   * @param tokens.refreshToken The refresh token to build the login response object for
   * @param user The user object to build the login response object for
   * @returns The login response object
   */
  private buildLoginResponse(tokens: { token: string; refreshToken: string }, user: IUser): ILoginResponse {
    return {
      ...tokens,
      user: {
        id: user.id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async forgotPassword(email: string): Promise<{ email: string; token: string }> {
    try {
      const user = await User.findOne({ email: { $eq: email } });
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const metadata = await LoginMetadata.findOne({ userId: user._id });
      if (!metadata) {
        throw new NotFoundError('Login metadata not found');
      }

      await metadata.generatePasswordResetToken();

      if (!metadata.passwordResetToken) {
        throw new InternalServerError('Failed to generate password reset token');
      }

      emailService.sendPasswordResetEmail(user.email, metadata.passwordResetToken);

      return { email: user.email, token: metadata.passwordResetToken }; // send something back
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Forgot Password failed: ${error.message}`);
    }
  }

  async resetPassword(token: string, data: IPasswordResetInput): Promise<void> {
    try {
      const metadata = await LoginMetadata.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!metadata) {
        throw new BadRequestError('Invalid or expired reset token');
      }

      await LoginMetadata.updateOne(
        { _id: metadata._id },
        {
          $set: { password: data.password },
          $unset: {
            passwordResetToken: '',
            passwordResetExpires: '',
          },
        },
      );
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Password reset failed: ${error.message}`);
    }
  }

  async refreshToken(data: IRefreshTokenInput): Promise<{ token: string }> {
    try {
      const decoded = jwt.verify(data.refreshToken, config.jwt.refreshSecret) as { id: string };
      const user = await this.findById(decoded.id);
      if (!user) {
        throw new ForbiddenError('Invalid refresh token');
      }

      const token = jwt.sign({ id: user._id }, config.jwt.secret as Secret, this.tokenOptions);
      return { token };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new UnauthorizedError('Token refresh failed');
    }
  }

  /**
   * Handle failed login attempts with account locking logic
   * @param metadata The login metadata object to handle the failed login attempts for
   */
  private async handleFailedLogin(metadata: ILoginMetadata): Promise<void> {
    try {
      metadata.failedLoginAttempts += 1;
      metadata.lastFailedLogin = new Date();

      if (metadata.failedLoginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        metadata.accountLockedUntil = new Date(Date.now() + this.ACCOUNT_LOCK_TIME);
      }

      await metadata.save();
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Failed to update login attempts: ${error.message}`);
    }
  }

  /**
   * Reset failed login attempts after successful login
   * @param metadata The login metadata object to reset the failed login attempts for
   */
  private async resetFailedLoginAttempts(metadata: ILoginMetadata): Promise<void> {
    try {
      metadata.failedLoginAttempts = 0;
      metadata.accountLockedUntil = null;
      await metadata.save();
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Failed to reset login attempts: ${error.message}`);
    }
  }

  /**
   * Generate JWT tokens
   * @param userId The user ID for which to generate tokens
   * @throws {InternalServerError} If token generation fails
   * @returns The generated tokens
   */
  private generateTokens(userId: string): { token: string; refreshToken: string } {
    try {
      const token = jwt.sign({ id: userId }, config.jwt.secret as Secret, this.tokenOptions);

      const refreshToken = jwt.sign({ id: userId }, config.jwt.refreshPrivateKey as Secret, this.refreshTokenOptions);

      return { token, refreshToken };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Token generation failed: ${error.message}`);
    }
  }
}

export const authService = new AuthService();
