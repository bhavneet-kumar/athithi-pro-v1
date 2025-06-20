import MessageComposePage from '@/features/crm/communication/MessageComposePage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/crm/communication/new/$leadId')({
  component: MessageComposePage,
});
