import { Router } from 'express';

import { passwordResetLimiter } from '../../shared/middlewares/rateLimiter.middleware';
import { validateBody, validateParams } from '../../shared/middlewares/validation.middleware';

import { authController } from './auth.controller';
import {
  registerSchema,
  passwordResetSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  tokenParamSchema,
  loginSchema,
} from './auth.validator';

const router = Router();

/**
 =* @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *               role:
 *                 type: string
 *                 pattern: '^[0-9a-fA-F]{24}$'
 */
// Register route with validation and rate limiting
router.post(
  '/register',
  // signupLimiter,
  validateBody(registerSchema),
  authController.register,
);

/**
 =* @swagger
 * /auth/verify-email/{token}:
 *   get:
 *     summary: Verify user email
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 */
// Email verification route
router.get('/verify-email/:token', validateParams(tokenParamSchema), authController.verifyEmail);

/**
 =* @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 */
// Login route with validation, rate limiting and account locking
router.post('/login', validateBody(loginSchema), authController.login);

/**
= * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Send password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 */
// Forgot password route
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword,
);

/**
 =* @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - confirmPassword
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 */
// Reset password route
router.post(
  '/reset-password/:token',
  validateParams(tokenParamSchema),
  validateBody(passwordResetSchema),
  authController.resetPassword,
);

/**
 =* @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh authentication token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 */
// Refresh token route
router.post('/refresh-token', validateBody(refreshTokenSchema), authController.refreshToken);

export default router;
