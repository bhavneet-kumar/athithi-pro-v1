import MessageComposePage from '@/features/crm/communication/MessageComposePage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/crm/communication/new')({
  component: MessageComposePage,
});
