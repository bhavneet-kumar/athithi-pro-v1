import BookingsPage from '@/features/crm/bookings/BookingsPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/crm/bookings/')({
  component: BookingsPage,
});
