import BookingFormPage from '@/features/crm/bookings/BookingFormPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/crm/bookings/new/$leadId')({
  component: BookingFormPage,
});
