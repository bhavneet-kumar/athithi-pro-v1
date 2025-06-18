import jwt, { SignOptions, Secret } from 'jsonwebtoken';

import { config } from '../../shared/config/index';
import {
  LOGIN_RATE_LIMITER_TIME,
  MINUTES_IN_MILLISECONDS,
  THIRTY_MINUTES_IN_MILLISECONDS,
  TWENTY_FOUR_HOURS_IN_MILLISECONDS,
} from '../../shared/constant/timeValues';
import { MAX_LOGIN_ATTEMPTS } from '../../shared/constant/validation';
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
} from '../../shared/utils/customError';

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

      // Check if user already exists
      const existingUser = await this.findOne({ email: data.email });
      if (existingUser) {
        throw new BusinessError('User with this email already exists');
      }

      // Create new user - use User model directly to avoid type conflicts
      const user = new User({
        ...data,
        role: roleExists._id,
      });
      await user.save();

      // Generate email verification token
      await user.generateEmailVerificationToken();

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
      if (!token) {
        throw new BadRequestError('Verification token is required');
      }

      const user = await this.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() },
      });

      if (!user) {
        throw new BadRequestError('Invalid or expired verification token');
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      await user.save();
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Email verification failed: ${error.message}`);
    }
  }

  async login(data: ILoginInput): Promise<ILoginResponse> {
    try {
      // Find user by email
      const user = await this.findOne({ email: data.email });
      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Check if account is locked
      if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        const lockTimeRemaining = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / MINUTES_IN_MILLISECONDS);
        throw new ForbiddenError(`Account is locked. Please try again in ${lockTimeRemaining} minutes.`);
      }

      // Verify password
      const isMatch = await user.comparePassword(data.password);
      if (!isMatch) {
        await this.handleFailedLogin(user);
        throw new UnauthorizedError('Invalid credentials');
      }

      // Reset failed login attempts on successful login
      await this.resetFailedLoginAttempts(user);

      // Generate tokens
      const tokens = this.generateTokens(user.id.toString());

      return {
        ...tokens,
        user: {
          id: user.id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Login failed: ${error.message}`);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    await user.generatePasswordResetToken();
    if (!user.passwordResetToken) {
      throw new InternalServerError('Failed to generate password reset token');
    }
    await emailService.sendPasswordResetEmail(user.email, user.passwordResetToken);
  }

  async resetPassword(token: string, data: IPasswordResetInput): Promise<void> {
    try {
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      user.password = data.password;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();
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
   * @param user The user object whose failed login attempts should be incremented and possibly locked
   */
  private async handleFailedLogin(user: IUser): Promise<void> {
    try {
      user.failedLoginAttempts += 1;
      user.lastFailedLogin = new Date();

      if (user.failedLoginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        user.accountLockedUntil = new Date(Date.now() + this.ACCOUNT_LOCK_TIME);
      }

      await user.save();
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Failed to update login attempts: ${error.message}`);
    }
  }

  /**
   * Reset failed login attempts after successful login
   * @param user The user object whose failed login attempts should be reset
   */
  private async resetFailedLoginAttempts(user: IUser): Promise<void> {
    try {
      user.failedLoginAttempts = 0;
      user.accountLockedUntil = null;
      await user.save();
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
