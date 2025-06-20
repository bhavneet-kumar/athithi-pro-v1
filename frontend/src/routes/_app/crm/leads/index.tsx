import LeadsPage from '@/features/crm/leads/LeadsPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/crm/leads/')({
  component: LeadsPage,
  pendingComponent: () => <div>Loading leads...</div>,
  errorComponent: () => <div>Error loading leads</div>,
});
