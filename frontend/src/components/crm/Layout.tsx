import React, { useEffect } from 'react';

import Header from './Header';
import OfflineBanner from './OfflineBanner';
import Sidebar from './Sidebar';

import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/hooks/use-toast';
import { useCrmStore } from '@/lib/store';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { sidebarCollapsed, isOffline, setOfflineStatus } = useCrmStore();

  // Add event listeners for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setOfflineStatus(false);
      toast({
        title: 'Connected',
        description: "You're back online. Your data will sync automatically.",
      });
    };

    const handleOffline = () => {
      setOfflineStatus(true);
      toast({
        title: 'Disconnected',
        description: "You're offline. Limited features available.",
        variant: 'destructive',
      });
    };

    // Check initial status
    setOfflineStatus(!navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOfflineStatus]);

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col'>
      <Header />

      {isOffline && <OfflineBanner />}

      <div className='flex flex-1 w-full'>
        <Sidebar />

        <main
          className={`flex-1 transition-all duration-200 ${
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          } overflow-y-auto max-h-[calc(100vh-65px)]`}
        >
          <div className='p-6 max-w-7xl mx-auto'>{children}</div>
        </main>
      </div>
      <Toaster />
    </div>
  );
};

export default Layout;
