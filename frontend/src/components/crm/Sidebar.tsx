import {
  User,
  MessageSquare,
  Calendar,
  FileCheck,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Users,
  LogOut,
} from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { useCrmStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';

const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useCrmStore();
  const { user, logout } = useAuth();

  const navItems = [
    {
      name: 'Leads',
      path: '/crm/leads',
      icon: User,
      shortcut: 'Alt+L',
    },
    {
      name: 'Communication',
      path: '/crm/communication',
      icon: MessageSquare,
      shortcut: 'Alt+C',
    },
    {
      name: 'Tasks',
      path: '/crm/tasks',
      icon: Calendar,
      shortcut: 'Alt+T',
    },
    {
      name: 'Bookings',
      path: '/crm/bookings',
      icon: FileCheck,
      shortcut: 'Alt+B',
    },
    {
      name: 'Segments',
      path: '/crm/segments',
      icon: Users,
      shortcut: 'Alt+S',
    },
    {
      name: 'Insights',
      path: '/crm/insights',
      icon: BarChart2,
      shortcut: 'Alt+I',
    },
  ];

  // Listen for keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'l':
            window.location.href = '/crm/leads';
            break;
          case 'c':
            window.location.href = '/crm/communication';
            break;
          case 't':
            window.location.href = '/crm/tasks';
            break;
          case 'b':
            window.location.href = '/crm/bookings';
            break;
          case 's':
            window.location.href = '/crm/segments';
            break;
          case 'i':
            window.location.href = '/crm/insights';
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-20 transition-all duration-200',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className='h-full flex flex-col justify-between p-2'>
        <div className='space-y-2'>
          {navItems.map(item => (
            <Link
              key={item.name}
              to={item.path}
              viewTransition
              className={cn(
                'flex items-center rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-gray-100'
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'h-5 w-5 mr-2',
                      isActive ? 'text-[#9b87f5]' : 'text-gray-500'
                    )}
                  />
                  {!sidebarCollapsed && (
                    <span className='flex-1'>{item.name}</span>
                  )}
                  {!sidebarCollapsed && (
                    <kbd className='hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-50 px-1.5 font-mono text-[10px] font-medium text-gray-600 opacity-100'>
                      {item.shortcut}
                    </kbd>
                  )}
                </>
              )}
            </Link>
          ))}
        </div>

        <div className='space-y-2'>
          {/* User Info */}
          {user && (
            <div
              className={cn(
                'px-2 py-2 border-t border-gray-100',
                sidebarCollapsed ? 'text-center' : ''
              )}
            >
              {!sidebarCollapsed ? (
                <div className='space-y-1'>
                  <div className='flex items-center space-x-2'>
                    <div className='w-8 h-8 bg-[#9b87f5] rounded-full flex items-center justify-center'>
                      <span className='text-white text-sm font-medium'>
                        {user.firstName.charAt(0)}
                        {user.lastName.charAt(0)}
                      </span>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900 truncate'>
                        {user.firstName} {user.lastName}
                      </p>
                      <p className='text-xs text-gray-500 truncate'>
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='w-8 h-8 bg-[#9b87f5] rounded-full flex items-center justify-center mx-auto'>
                  <span className='text-white text-sm font-medium'>
                    {user.firstName.charAt(0)}
                    {user.lastName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Collapse Button */}
          <Button
            variant='ghost'
            className='w-full justify-start'
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? (
              <ChevronRight className='h-5 w-5' />
            ) : (
              <>
                <ChevronLeft className='h-5 w-5 mr-2' />
                <span>Collapse</span>
              </>
            )}
          </Button>

          {/* Logout Button */}
          <Button
            variant='ghost'
            className='w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50'
            onClick={logout}
          >
            <LogOut className='h-5 w-5 mr-2' />
            {!sidebarCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
