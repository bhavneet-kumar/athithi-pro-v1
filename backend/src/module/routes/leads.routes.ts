import { Router } from 'express';
import passport from 'passport';

import { leadsController, LeadsController } from '../controllers/leads.controller';
import { checkPermission } from '../../shared/middlewares/permissions.middleware';

const router = Router();

/**
 * @swagger
 * /leads:
 *   post:
 *     summary: Create a new lead
 *     tags: [Leads]
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
 * @swagger
 * /leads:
 *   get:
 *     summary: Get all leads
 *     tags: [Leads]
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
 * @swagger
 * /leads/{leadId}:
 *   get:
 *     summary: Get lead details
 *     tags: [Leads]
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
 * @swagger
 * /leads/{leadId}:
 *   delete:
 *     summary: Delete a lead
 *     tags: [Leads]
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
