import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { User, IUser } from '../../shared/models/user.model';
import { Role } from '../../shared/models/role.model';
import { IAgency } from '../../shared/models/agency.model';
import { LoginMetadata, ILoginMetadata } from '../../shared/models/loginMetadata.model';

import { emailService } from '../../shared/services/email.service';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  BusinessError,
  InternalServerError,
  CustomError,
} from '../../shared/utils/CustomError';
import { BaseService } from '../../shared/services/BaseService';
import { config } from '../../shared/config/index';
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
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly ACCOUNT_LOCK_TIME = 15 * 60 * 1000; // 15 minutes

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
          `User with this email already exists for Agency: ${existingUser.agency.name}, Database unique Id: ${existingUser.agency._id}`
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

      await metadata.generateEmailVerificationToken();
      await emailService.sendVerificationEmail(user.email, metadata.emailVerificationToken!);
    } catch (error: any) {
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

      if (!metadata) throw new BadRequestError('Invalid or expired verification token');

      metadata.isEmailVerified = true;
      metadata.emailVerificationToken = undefined;
      metadata.emailVerificationExpires = undefined;
      await metadata.save();

    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Email verification failed: ${error.message}`);
    }
  }

  async login(data: ILoginInput): Promise<ILoginResponse> {
    try {
      const user = await this.findOne({ email: data.email });
      if (!user) throw new UnauthorizedError('Invalid credentials');

      const metadata = await LoginMetadata.findOne({ userId: user._id });
      if (!metadata) throw new UnauthorizedError('Invalid credentials');

      if (metadata.accountLockedUntil && metadata.accountLockedUntil > new Date()) {
        const lockMins = Math.ceil((metadata.accountLockedUntil.getTime() - Date.now()) / 60000);
        throw new ForbiddenError(`Account is locked. Try again in ${lockMins} minutes.`);
      }

      const isMatch = await metadata.comparePassword(data.password);
      if (!isMatch) {
        await this.handleFailedLogin(metadata);
        throw new UnauthorizedError('Invalid credentials');
      }

      await this.resetFailedLoginAttempts(metadata);

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
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Login failed: ${error.message}`);
    }
  }

  async forgotPassword(email: string): Promise<void> {

    try {
      const user = await User.findOne({ email });
      if (!user) throw new NotFoundError('User not found');

      const metadata = await LoginMetadata.findOne({ userId: user._id });
      if (!metadata) throw new NotFoundError('Login metadata not found');

      await metadata.generatePasswordResetToken();
      await emailService.sendPasswordResetEmail(user.email, metadata.passwordResetToken!);

    } catch (error: any) {
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

      if (!metadata) throw new BadRequestError('Invalid or expired reset token');

      metadata.password = data.password;
      metadata.passwordResetToken = undefined;
      metadata.passwordResetExpires = undefined;
      await metadata.save();
    } catch (error: any) {
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
      if (!user) throw new ForbiddenError('Invalid refresh token');

      const token = jwt.sign({ id: user._id }, config.jwt.secret as Secret, this.tokenOptions);
      return { token };

    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new UnauthorizedError('Token refresh failed');
    }
  }

  /**
   * Handle failed login attempts with account locking logic
   */
  private async handleFailedLogin(metadata: ILoginMetadata): Promise<void> {
    try {
      metadata.failedLoginAttempts += 1;
      metadata.lastFailedLogin = new Date();

      if (metadata.failedLoginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        metadata.accountLockedUntil = new Date(Date.now() + this.ACCOUNT_LOCK_TIME);
      }

      await metadata.save();
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Failed to update login attempts: ${error.message}`);
    }
  }

  /**
   * Reset failed login attempts after successful login
   */
  private async resetFailedLoginAttempts(metadata: ILoginMetadata): Promise<void> {
    try {
      metadata.failedLoginAttempts = 0;
      metadata.accountLockedUntil = undefined;
      await metadata.save();
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Failed to reset login attempts: ${error.message}`);
    }
  }

  /**
   * Generate JWT tokens
   */
  private generateTokens(userId: string): { token: string; refreshToken: string } {
    try {
      const token = jwt.sign({ id: userId }, config.jwt.secret as Secret, this.tokenOptions);

      const refreshToken = jwt.sign({ id: userId }, config.jwt.refreshPrivateKey as Secret, this.refreshTokenOptions);

      return { token, refreshToken };
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Token generation failed: ${error.message}`);
    }
  }
}

export const authService = new AuthService();