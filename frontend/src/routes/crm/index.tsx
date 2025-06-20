import Home from '@/features/crm/Home';
import { createFileRoute } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute('/crm/')({
  component: Home,
  errorComponent: () => (
    <div className='flex h-[calc(100vh-4rem)] items-center justify-center'>
      <div className='text-red-500'>Error loading CRM</div>
    </div>
  ),
  pendingComponent: () => (
    <div className='flex h-[calc(100vh-4rem)] items-center justify-center'>
      <Loader2 className='h-8 w-8 animate-spin text-primary' />
    </div>
  ),
});
