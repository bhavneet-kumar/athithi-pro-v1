import Layout from '@/components/crm/Layout';
import { Toaster } from '@/components/ui/sonner';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Loader2 } from 'lucide-react';

function RootComponent() {
  return (
    <>
      <Toaster />
      <Layout>
        <Outlet />
      </Layout>
      <TanStackRouterDevtools />
    </>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  pendingComponent: () => (
    <div className='flex h-[calc(100vh-4rem)] items-center justify-center'>
      <Loader2 className='h-8 w-8 animate-spin text-primary' />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className='flex h-[calc(100vh-4rem)] items-center justify-center'>
      <div className='text-red-500'>Error: {error.message}</div>
    </div>
  ),
});
