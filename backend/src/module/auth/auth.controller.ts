// src/module/auth/auth.controller.ts

import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../../shared/utils/CustomError';
import { authService } from './auth.service';
import { CreatedSuccess, OkSuccess, NoContentSuccess } from '../../shared/utils/CustomSuccess';

// Optional: extend Request to include user
interface RequestWithUser extends Request {
  user?: { id: string };
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body?.email || !req.body?.password) {
        throw new BadRequestError('Email and password are required');
      }
      await authService.register(req.body);
      res.customSuccess(
        new CreatedSuccess(null, 'User created successfully. Please check your email for verification.')
      );
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      if (!token) throw new BadRequestError('Verification token is required');
      await authService.verifyEmail(token);
      res.customSuccess(new OkSuccess(null, 'Email verified successfully'));
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new BadRequestError('Email and password are required');
      }
      const result = await authService.login(req.body);
      res.customSuccess(new OkSuccess(result, 'Login successful'));
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) throw new BadRequestError('Email is required');
      await authService.forgotPassword(email);
      res.customSuccess(new OkSuccess(null, 'Password reset email sent'));
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      if (!token) throw new BadRequestError('Reset token is required');
      await authService.resetPassword(token, req.body);
      res.customSuccess(new OkSuccess(null, 'Password reset successful'));
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw new BadRequestError('Refresh token is required');
      const result = await authService.refreshToken(req.body);
      res.customSuccess(new OkSuccess(result, 'Token refreshed successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) throw new BadRequestError('User ID not found in request');
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

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.customSuccess(new NoContentSuccess('Logged out successfully'));
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
