import { Menu, Search, Wifi, WifiOff, Bell } from 'lucide-react';
import React, { useEffect } from 'react';

import CurrencySelector from './CurrencySelector';
import LanguageSelector from './LanguageSelector';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCrmStore } from '@/lib/store';
import { Link } from '@tanstack/react-router';

const Header: React.FC = () => {
  const { toggleSidebar, isOffline, setOfflineStatus } = useCrmStore();

  // Check for internet connection changes
  useEffect(() => {
    const handleOffline = () => setOfflineStatus(true);
    const handleOnline = () => setOfflineStatus(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Initial check
    setOfflineStatus(!navigator.onLine);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [setOfflineStatus]);

  return (
    <header className='sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-sm flex h-16 items-center'>
      <div className='container flex max-w-full px-4 items-center justify-between'>
        <div className='flex items-center'>
          <Button
            variant='ghost'
            size='icon'
            className='mr-2'
            onClick={toggleSidebar}
            aria-label='Toggle sidebar'
          >
            <Menu className='h-5 w-5' />
          </Button>
          <div className='hidden md:block'>
            <Link to='/crm' className='text-xl font-semibold text-[#9b87f5]'>
              AthitiPRO CRM
            </Link>
          </div>
        </div>

        <div className='flex-1 mx-4 max-w-md hidden md:block'>
          <div className='relative'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-gray-500' />
            <Input
              type='search'
              placeholder='Search leads, tasks, bookings...'
              className='w-full pl-9 bg-gray-50'
              onKeyDown={e => {
                // Add keyboard shortcuts
                if (e.key === '/' && e.ctrlKey) {
                  e.preventDefault();
                  (e.target as HTMLInputElement).focus();
                }
              }}
            />
          </div>
        </div>

        <div className='flex items-center space-x-1'>
          <CurrencySelector />
          <LanguageSelector />

          <Button variant='ghost' size='icon' aria-label='Notifications'>
            <Bell className='h-5 w-5' />
          </Button>

          <Button variant='ghost' size='icon' aria-label='Connection status'>
            {isOffline ? (
              <WifiOff className='h-5 w-5 text-red-500' />
            ) : (
              <Wifi className='h-5 w-5 text-green-500' />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
