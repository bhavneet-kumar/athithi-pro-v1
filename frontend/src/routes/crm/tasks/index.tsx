import TasksPage from '@/features/crm/tasks/TasksPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/crm/tasks/')({
  component: TasksPage,
});
