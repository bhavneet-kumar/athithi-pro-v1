import { Router } from 'express';
import passport from 'passport';

import { checkPermission } from '../../shared/middlewares/checkPermission.middleware';
import { validateBody, validateParams, validateQuery } from '../../shared/middlewares/validation.middleware';

import { leadController } from './lead.controller';
import { leadValidator } from './lead.validator';

const router = Router();

router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'create'),
  validateBody(leadValidator.createSchema),
  leadController.create,
);

router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'read'),
  validateQuery(leadValidator.filterSchema),
  leadController.getAll,
);

router.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'read'),
  validateParams(leadValidator.idSchema),
  leadController.getById,
);

router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'update'),
  validateParams(leadValidator.idSchema),
  validateBody(leadValidator.updateSchema),
  leadController.update,
);

router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  checkPermission('leads', 'delete'),
  validateParams(leadValidator.idSchema),
  leadController.delete,
);

export const leadRoutes = router;
