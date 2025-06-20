import TaskFormPage from '@/features/crm/tasks/TaskFormPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/crm/tasks/new/$leadId')({
  component: TaskFormPage,
});
