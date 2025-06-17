import { Router } from 'express';

import { validateBody, validateParams, validateQuery } from '../../shared/middlewares/validation.middleware';

import { leadController } from './lead.controller';
import { leadValidator } from './lead.validator';

const router = Router();

router.post('/', validateBody(leadValidator.createSchema), leadController.create);

router.get('/', validateQuery(leadValidator.filterSchema), leadController.getAll);

router.get('/:id', validateParams(leadValidator.idSchema), leadController.getById);

router.put(
  '/:id',
  validateParams(leadValidator.idSchema),
  validateBody(leadValidator.updateSchema),
  leadController.update,
);

router.delete('/:id', validateParams(leadValidator.idSchema), leadController.delete);

export const leadRoutes = router;
