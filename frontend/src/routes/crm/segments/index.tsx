import SegmentsPage from '@/features/crm/segments/SegmentsPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/crm/segments/')({
  component: SegmentsPage,
});
