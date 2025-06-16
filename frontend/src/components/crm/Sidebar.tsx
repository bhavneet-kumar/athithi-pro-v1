import {
  User,
  MessageSquare,
  Calendar,
  FileCheck,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { useCrmStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';

const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useCrmStore();

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

        <Button
          variant='ghost'
          className='w-full justify-start mt-auto'
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
      </div>
    </aside>
  );
};

export default Sidebar;
