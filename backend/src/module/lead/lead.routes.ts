import { Router } from 'express';

import { validateBody } from '../../shared/middlewares/validation.middleware';

import { leadController } from './lead.controller';
import { leadValidator } from './lead.validator';

const router = Router();

router.post('/', validateBody(leadValidator.createSchema), leadController.create);

router.get('/', leadController.getAll);

router.get('/:id', leadController.getById);

// router.put(
//   '/:id',
//   validateParams(leadValidator.idSchema),
//   validateBody(leadValidator.updateSchema),
//   leadController.update,
// );

// router.delete('/:id', validateParams(leadValidator.idSchema), leadController.delete);

export const leadRoutes = router;
