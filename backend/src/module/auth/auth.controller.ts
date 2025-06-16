import { Request, Response, NextFunction } from 'express';

import { BadRequestError, InternalServerError } from '../../shared/utils/CustomError';

import { authService } from './auth.service';

/**
 * Authentication Controller Class
 * Implements controller layer with proper error handling and response formatting
 */
export class AuthController {
  /**
   * Register a new user
   * Validation is handled by middleware
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'User created successfully. Please check your email for verification.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify user email with token
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
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Assuming user is attached to request by auth middleware
      const userId = (req as any).user?.id;

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
