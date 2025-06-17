import { Router } from 'express';
import passport from 'passport';

import { checkPermission } from '../../shared/middlewares/checkPermission.middleware';
import { validateBody, validateParams, validateQuery } from '../../shared/middlewares/validation.middleware';

import { leadsController, LeadsController } from './leads.controller';

const router = Router();

/**
 * @openapi
 * /api/v1/leads:
 *   post:
 *     summary: Create a new lead
 *     description: Create a new lead in the system.
 *     responses: 200
 */
// Create new lead
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'create'),
  leadsController.create.bind(leadsController),
);

/**
 * @openapi
 * /api/v1/leads:
 *   get:
 *     summary: Get all leads
 *     responses:
 *       200:
 *       description: List of leads
 */
// List All Leads
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'read'),
  leadsController.getAll.bind(leadsController),
);

/**
 * @openapi
 * /api/v1/leads/{leadId}:
 *   get:
 *     summary: Get lead details
 *     description: Retrieve details of a specific lead by ID.
 *     responses: 200
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Leads MongoDB ObjectId
 */
// Get lead details
router.get(
  '/:leadId',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'read'),
  leadsController.getById.bind(leadsController),
);

/**
 * @openapi
 * /api/v1/leads/{leadId}:
 *   delete:
 *     summary: Delete a lead
 *     description: Delete a specific lead by ID.
 *     responses: 200
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Leads MongoDB ObjectId
 */
// Delete lead
router.delete(
  '/:leadId',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'delete'),
  leadsController.delete.bind(leadsController),
);

export default router;
