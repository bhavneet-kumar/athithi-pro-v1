import { Router } from 'express';

import '../types/express/index';
import { OkSuccess } from '../shared/utils/CustomSuccess';

import agencyRoutes from './agency/agency.routes';
import authRoutes from './auth/auth.routes';
import { leadRoutes } from './lead/lead.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/agency', agencyRoutes);
router.use('/lead', leadRoutes);

router.get('/health', (req, res) => {
  const uptime = process.uptime();

  res.customSuccess(
    new OkSuccess({
      status: 'OK',
      uptime: Math.floor(uptime),
      timestamp: new Date().toISOString(),
    }),
  );
});

export default router;
