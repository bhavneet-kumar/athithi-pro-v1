import BookingsPage from '@/features/crm/bookings/BookingsPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/crm/bookings/')({
  component: BookingsPage,
});
