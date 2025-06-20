import { AuthTokens, User } from '@/store/slices/userSlice';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute('/')({
  beforeLoad(ctx) {
    const { tokens } = ctx.context as { tokens: AuthTokens };
    if (!tokens) throw redirect({ to: '/login' });
    if (tokens) throw redirect({ to: '/crm' });
  },
  pendingComponent: () => (
    <div className='flex h-screen items-center justify-center'>
      <div className='flex flex-col items-center gap-4'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
        <p className='text-muted-foreground'>Loading...</p>
      </div>
    </div>
  ),
});
