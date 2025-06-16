import TaskFormPage from '@/features/crm/tasks/TaskFormPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/crm/tasks/new')({
  component: TaskFormPage,
});
