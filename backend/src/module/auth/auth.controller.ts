// src/module/auth/auth.controller.ts

import { Request, Response, NextFunction } from 'express';

import { BadRequestError } from '../../shared/utils/customError';
import { CreatedSuccess, OkSuccess, NoContentSuccess } from '../../shared/utils/customSuccess';

import { authService } from './auth.service';

// Optional: extend Request to include user

export class AuthController {
  /**
   * Register a new user
   * Validation is handled by middleware
   * @param req Express request object containing user registration data
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body?.email || !req.body?.password) {
        throw new BadRequestError('Email and password are required');
      }
      const user = await authService.register(req.body);
      res.customSuccess(
        new CreatedSuccess(user, 'User created successfully. Please check your email for verification.'),
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify user email with token
   * @param req Express request object containing verification token in params
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      if (!token) {
        throw new BadRequestError('Verification token is required');
      }
      await authService.verifyEmail(token);
      res.customSuccess(new OkSuccess(null, 'Email verified successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * User login
   * Validation is handled by middleware
   * @param req Express request object containing login credentials
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log(req.body, '++++++++++++++');
      const { email, password } = req.body;
      if (!email || !password) {
        throw new BadRequestError('Email and password are required');
      }
      console.log(req.body, '++++++++++++++');
      const result = await authService.login(req.body);
      res.customSuccess(new OkSuccess(result, 'Login successful'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send password reset email
   * @param req Express request object containing user's email in body
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        throw new BadRequestError('Email is required');
      }
      await authService.forgotPassword(email);
      res.customSuccess(new OkSuccess(null, 'Password reset email sent'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password with token
   * @param req Express request object containing reset token in params and new password in body
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      if (!token) {
        throw new BadRequestError('Reset token is required');
      }
      await authService.resetPassword(token, req.body);
      res.customSuccess(new OkSuccess(null, 'Password reset successful'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh authentication token
   * @param req Express request object containing refresh token in body
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new BadRequestError('Refresh token is required');
      }

      const result = await authService.refreshToken(req.body);

      res.customSuccess(new OkSuccess(result, 'Token refreshed successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile (protected route)
   * @param req Express request object with user info attached by auth middleware
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Assuming user is attached to request by auth middleware
      const userId = (req as Request & { user: { id: string } }).user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      const user = await authService.findById(userId, ['role', 'agency']);
      const profile = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        agency: user.agency,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
      };
      res.customSuccess(new OkSuccess(profile, 'Profile fetched successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user (invalidate token on client side)
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.customSuccess(new NoContentSuccess('Logged out successfully'));
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
