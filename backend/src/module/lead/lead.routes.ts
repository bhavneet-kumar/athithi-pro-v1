import { Router } from 'express';
import passport from 'passport';

import { checkPermission } from '../../shared/middlewares/checkPermission.middleware';
import { validateBody, validateParams, validateQuery } from '../../shared/middlewares/validation.middleware';

import { leadController } from './lead.controller';
import { leadValidator } from './lead.validator';

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
  validateBody(leadValidator.createSchema),
  leadController.create,
);

/**
 * @swagger
 * /leads:
 *   get:
 *     summary: Get all leads
 *     description: Retrieve a list of all leads with optional filtering and pagination.
 *     tags: [Leads]
 *     responses: 200
 */
// List All Leads
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'read'),
  validateQuery(leadValidator.filterSchema),
  leadController.getAll,
);

router.get(
  '/export',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'read'),
  validateQuery(leadValidator.filterSchema),
  leadController.exportLeads,
);

/**
 * @swagger
 * /leads/{id}:
 *   get:
 *     summary: Get lead details
 *     tags: [Leads]
 *     description: Retrieve details of a specific lead by ID.
 *     responses: 200
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Leads MongoDB ObjectId
 */
// Get lead details
router.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'read'),
  validateParams(leadValidator.idSchema),
  leadController.getById,
);

/**
 * @swagger
 * /leads/{id}:
 *   put:
 *     summary: Update a lead
 *     tags: [Leads]
 *     responses: 200
 *     description: Update details of a specific lead by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Leads MongoDB ObjectId
 */
// Update a specific lead by ID
router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'update'),
  validateParams(leadValidator.idSchema),
  validateBody(leadValidator.updateSchema),
  leadController.update,
);

/**
 * @swagger
 * /leads/{id}:
 *   delete:
 *     summary: Delete a lead
 *     tags: [Leads]
 *     description: Delete a specific lead by ID.
 *     responses: 200
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Leads MongoDB ObjectId
 */
// Delete lead
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'delete'),
  validateParams(leadValidator.idSchema),
  leadController.delete,
);

router.put(
  '/:id/change-status',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'update'),
  validateParams(leadValidator.idSchema),
  validateBody(leadValidator.changeStatusSchema),
  leadController.changeStatus,
);

// TODO: May add a partial update route as well in future if the need arises

export const leadRoutes = router;
