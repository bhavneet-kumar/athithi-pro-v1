import { Router } from 'express';
import '../types/express/index';
import authRoutes from './auth/auth.routes';
import leadRoutes from './leads/leads.routes';
import agencyRoutes from './agency/agency.routes';
import { OkSuccess } from '../shared/utils/CustomSuccess';

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
