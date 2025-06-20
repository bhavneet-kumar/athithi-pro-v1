import TasksPage from '@/features/crm/tasks/TasksPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/crm/tasks/')({
  component: TasksPage,
});
