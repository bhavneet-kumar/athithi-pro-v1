import { Router } from 'express';

import { OkSuccess } from '../shared/utils/customsuccessres';
import '../types/express/index';

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
