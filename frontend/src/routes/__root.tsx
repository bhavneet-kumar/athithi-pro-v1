import Layout from '@/components/crm/Layout';
import { Toaster } from '@/components/ui/sonner';
import NotFound from '@/pages/NotFound';
import { RootState } from '@/store';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';

function RootComponent() {
  const { tokens } = useSelector((state: RootState) => state.user);

  return (
    <>
      <Toaster />
      {tokens ? (
        <Layout>
          <Outlet />
        </Layout>
      ) : (
        <Outlet />
      )}
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
  notFoundComponent: () => <NotFound />,
});
