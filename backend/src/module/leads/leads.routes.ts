import { Router } from 'express';
import passport from 'passport';

import { checkPermission } from '../../shared/middlewares/checkPermission.middleware';
import { validateBody, validateParams, validateQuery } from '../../shared/middlewares/validation.middleware';

import { leadsController, LeadsController } from './leads.controller';

const router = Router();

/**
 * @swagger
 * /agencies:
 *   post:
 *     summary: Create a new lead
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
// Create new lead
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'create'),
  leadsController.createLead,
);

/**
 * @swagger
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
  checkPermission('leads', 'read'),
  leadsController.getLeads,
);

/**
 * @swagger
 * /agencies/{leadId}:
 *   get:
 *     summary: Get lead by ID
 *     tags: [Agencies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: lead MongoDB ObjectId
 */
// Get lead details
router.get(
  '/:leadId',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'read'),
  leadsController.getLeadById,
);

/**
 * @swagger
 * /agencies/{leadId}:
 *   delete:
 *     summary: Delete lead
 *     tags: [Agencies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: lead MongoDB ObjectId
 */
// Delete lead
router.delete(
  '/:leadId',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'delete'),
  leadsController.deleteLeadById,
);

export default router;
