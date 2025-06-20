import CommunicationPage from '@/features/crm/communication/CommunicationPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/crm/communication/')({
  component: CommunicationPage,
});
