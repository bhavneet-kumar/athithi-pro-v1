import LeadDetailPage from '@/features/crm/leads/LeadDetailPage';
import { createFileRoute } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute('/_app/crm/leads/$id')({
  component: LeadDetailPage,
  errorComponent: () => (
    <div className='flex h-[calc(100vh-4rem)] items-center justify-center'>
      <div className='text-red-500'>Error loading lead details</div>
    </div>
  ),
  pendingComponent: () => (
    <div className='flex h-[calc(100vh-4rem)] items-center justify-center'>
      <Loader2 className='h-8 w-8 animate-spin text-primary' />
    </div>
  ),
});
