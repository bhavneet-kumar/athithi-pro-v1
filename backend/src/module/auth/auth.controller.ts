import { Request, Response, NextFunction } from 'express';

import { BadRequestError } from '../../shared/utils/customError';
import { CreatedSuccess } from '../../shared/utils/customSuccess';

import { authService } from './auth.service';

/**
 * Authentication Controller Class
 * Implements controller layer with proper error handling and response formatting
 */
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
      await authService.register(req.body);
      res.customSuccess(new CreatedSuccess('User created successfully. Please check your email for verification.'));
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
      res.json({
        success: true,
        message: 'Email verified successfully',
      });
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
      const result = await authService.login(req.body);
      res.json({
        success: true,
        data: result,
      });
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
      await authService.forgotPassword(email);
      res.json({
        success: true,
        message: 'Password reset email sent',
      });
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
      res.json({
        success: true,
        message: 'Password reset successful',
      });
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
      const result = await authService.refreshToken(req.body);
      res.json({
        success: true,
        data: result,
      });
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

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          agency: user.agency,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
        },
      });
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
      // In a real implementation, you might want to blacklist the token
      // For now, we'll just return a success message
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
