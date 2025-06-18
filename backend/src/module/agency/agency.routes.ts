import { Router } from 'express';
import passport from 'passport';

import { checkPermission } from '../../shared/middlewares/checkPermission.middleware';
import { validateBody, validateParams, validateQuery } from '../../shared/middlewares/validation.middleware';

import { agencyController } from './agency.controller';
import {
  createAgencySchema,
  updateAgencySchema,
  updateAgencySettingsSchema,
  listAgenciesQuerySchema,
  agencyIdParamSchema,
  agencyCodeParamSchema,
} from './agency.validator';

const router = Router();

/**
=* @swagger
 * /agencies:
 *   post:
 *     summary: Create a new agency
 *     tags: [Agencies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - domain
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               code:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 10
 *               domain:
 *                 type: string
 *                 format: domain
 *               settings:
 *                 type: object
 *                 properties:
 *                   maxUsers:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 10000
 *                   allowedDomains:
 *                     type: array
 *                     items:
 *                       type: string
 */
// Create new agency (only super admin can do this)
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  checkPermission('agencies', 'create'),
  validateBody(createAgencySchema),
  agencyController.createAgency,
);

/**
=* @swagger
 * /agencies:
 *   get:
 *     summary: List agencies with pagination and filtering
 *     tags: [Agencies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name, code, or domain
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, code, createdAt, updatedAt]
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 */
// List agencies
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  checkPermission('agencies', 'read'),
  validateQuery(listAgenciesQuerySchema),
  agencyController.listAgencies,
);

/**
 =* @swagger
 *=/agencies/{agencyId}:
 *   get:
 *     summary: Get agency by ID
 *     tags: [Agencies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: agencyId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Agency MongoDB ObjectId
 */
// Get agency details
router.get(
  '/:agencyId',
  passport.authenticate('jwt', { session: false }),
  checkPermission('agencies', 'read'),
  validateParams(agencyIdParamSchema),
  agencyController.getAgency,
);

/**
 =* @swagger
 * /agencies/code/{code}:
 *   get:
 *     summary: Get agency by code
 *     tags: [Agencies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]+$'
 *         description: Agency code
 */
// Get agency by code
router.get(
  '/code/:code',
  passport.authenticate('jwt', { session: false }),
  checkPermission('agencies', 'read'),
  validateParams(agencyCodeParamSchema),
  agencyController.getAgencyByCode,
);

/**
 =* @swagger
 * /agencies/{agencyId}:
 *   put:
 *     summary: Update agency
 *     tags: [Agencies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: agencyId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Agency MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               code:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 10
 *               domain:
 *                 type: string
 *                 format: domain
 *               isActive:
 *                 type: boolean
 *               settings:
 *                 type: object
 */
// Update agency
router.put(
  '/:agencyId',
  passport.authenticate('jwt', { session: false }),
  checkPermission('agencies', 'update'),
  validateParams(agencyIdParamSchema),
  validateBody(updateAgencySchema),
  agencyController.updateAgency,
);

/**
 =* @swagger
 * /agencies/{agencyId}/settings:
 *   patch:
 *     summary: Update agency settings
 *     tags: [Agencies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: agencyId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Agency MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settings
 *             properties:
 *               settings:
 *                 type: object
 *                 required:
 *                   - maxUsers
 *                   - allowedDomains
 *                 properties:
 *                   maxUsers:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 10000
 *                   allowedDomains:
 *                     type: array
 *                     items:
 *                       type: string
 *                   customBranding:
 *                     type: object
 */
// Update agency settings
router.patch(
  '/:agencyId/settings',
  passport.authenticate('jwt', { session: false }),
  checkPermission('agencies', 'update'),
  validateParams(agencyIdParamSchema),
  validateBody(updateAgencySettingsSchema),
  agencyController.updateAgencySettings,
);

/**
 =* @swagger
 * /agencies/{agencyId}:
 *   delete:
 *     summary: Delete agency
 *     tags: [Agencies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: agencyId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Agency MongoDB ObjectId
 */
// Delete agency
router.delete(
  '/:agencyId',
  passport.authenticate('jwt', { session: false }),
  checkPermission('agencies', 'delete'),
  validateParams(agencyIdParamSchema),
  agencyController.deleteAgency,
);

export default router;
