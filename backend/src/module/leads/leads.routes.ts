import { Router } from 'express';
import passport from 'passport';

import { checkPermission } from '../../shared/middlewares/checkPermission.middleware';
import { validateBody, validateParams, validateQuery } from '../../shared/middlewares/validation.middleware';

import { leadsController, LeadsController } from './leads.controller';

const router = Router();

// Create new lead
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'create'),
  leadsController.create.bind(leadsController),
);

// List All Leads
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'read'),
  leadsController.getAll.bind(leadsController),
);

// Get lead details
router.get(
  '/:leadId',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'read'),
  leadsController.getById.bind(leadsController),
);

// Delete lead
router.delete(
  '/:leadId',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'delete'),
  leadsController.delete.bind(leadsController),
);

export default router;
