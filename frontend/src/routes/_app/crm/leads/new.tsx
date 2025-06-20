import LeadFormPage from '@/features/crm/leads/LeadFormPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/crm/leads/new')({
  component: LeadFormPage,
  pendingComponent: () => <div>Loading lead form...</div>,
  errorComponent: () => <div>Error loading lead form</div>,
});
