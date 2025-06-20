import { Router } from 'express';

import '../types/express/index';
import { OkSuccess } from '../shared/utils/customSuccess';

import agencyRoutes from './agency/agency.routes';
import authRoutes from './auth/auth.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/agency', agencyRoutes);

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
