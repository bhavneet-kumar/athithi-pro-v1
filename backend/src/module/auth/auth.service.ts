import jwt, { SignOptions, Secret } from 'jsonwebtoken';


import { config } from '../../shared/config/index';
import {
  LOGIN_RATE_LIMITER_TIME,
  MINUTES_IN_MILLISECONDS,
  THIRTY_MINUTES_IN_MILLISECONDS,
  TWENTY_FOUR_HOURS_IN_MILLISECONDS,
} from '../../shared/constant/timeValues';
import { MAX_LOGIN_ATTEMPTS } from '../../shared/constant/validation';
import { ILoginMetadata, LoginMetadata } from '../../shared/models/loginMetadata.model';
import { Role } from '../../shared/models/role.model';
import { User, IUser } from '../../shared/models/user.model';
import { BaseService } from '../../shared/services/BaseService';
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

  async register(data: IRegisterInput): Promise<void> {
    try {
      // Validate role exists
      const roleExists = await Role.findById(data.role);
      if (!roleExists) {
        throw new BadRequestError('Invalid role provided');
      }

      const existingUser = (await this.findOne({ email: data.email }, ['agency'])) as IUser & { agency: IAgency };

      if (existingUser) {
        throw new BusinessError(
          `User with this email already exists for Agency: ${existingUser.agency.name}, Database unique Id: ${existingUser.agency._id}`,
        );
      }

      // Create new user - use User model directly to avoid type conflicts
      const user = new User({
        ...data,
        role: roleExists._id,
      });
      await user.save();

      const metadata = new LoginMetadata({
        userId: user._id,
        password: data.password,
      });
      await metadata.save();

      // Send verification email
      if (!user.emailVerificationToken) {
        throw new InternalServerError('Failed to generate email verification token');
      }
      await emailService.sendVerificationEmail(user.email, user.emailVerificationToken);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Registration failed: ${error.message}`);
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

      metadata.isEmailVerified = true;
      metadata.emailVerificationToken = null;
      metadata.emailVerificationExpires = null;
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
        throw new UnauthorizedError('Invalid credentials');
      }

      const metadata = await LoginMetadata.findOne({ userId: user._id });
      if (!metadata) {
        throw new UnauthorizedError('Invalid credentials');
      }

      this.checkAccountLockStatus(metadata, user);

      await this.verifyUserPassword(user, data.password, metadata);

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
    const isMatch = await user.comparePassword(password);
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

  async forgotPassword(email: string): Promise<void> {
    try {
      const user = await User.findOne({ email });
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
      await emailService.sendPasswordResetEmail(user.email, metadata.passwordResetToken);
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

      metadata.password = data.password;
      metadata.passwordResetToken = null;
      metadata.passwordResetExpires = null;
      await metadata.save();
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
