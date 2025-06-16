import InsightsPage from '@/features/crm/insights/InsightsPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/crm/insights/')({
  component: InsightsPage,
});
