import LeadFormPage from '@/features/crm/leads/LeadFormPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/crm/leads/$id/edit')({
  component: LeadFormPage,
});
