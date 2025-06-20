import CrmDashboard from '@/features/crm/CrmDashboard';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/crm/dashboard')({
  component: CrmDashboard,
});
