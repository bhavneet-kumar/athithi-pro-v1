import { Router } from 'express';

import '../types/express/index';
import { OkSuccess } from '../shared/utils/CustomSuccess';

import agencyRoutes from './routes/agency.routes';
import authRoutes from './routes/auth.routes';
import leadRoutes from './routes/leads.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);
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
