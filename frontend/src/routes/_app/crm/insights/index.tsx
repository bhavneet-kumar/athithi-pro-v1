import InsightsPage from '@/features/crm/insights/InsightsPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/crm/insights/')({
  component: InsightsPage,
});
