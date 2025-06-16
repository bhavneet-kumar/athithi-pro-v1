import {
  AlertTriangle,
  ArrowUpDown,
  FilePlus,
  FileText,
  Filter,
  LayoutGrid,
  List,
  Plus,
  User,
} from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

import BulkUploadModal from './BulkUploadModal';
import LeadKanbanView from './LeadKanbanView';
import LeadListView from './LeadListView';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useCrmStore } from '@/lib/store';
import { LeadSource, LeadStatus } from '@/types/crm';

import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from '@tanstack/react-router';

interface FilterState {
  status: LeadStatus | 'all';
  source: LeadSource | 'all';
  dateRange: 'all' | 'today' | 'week' | 'month';
  assignee: string;
  priority: 'all' | 'high' | 'medium' | 'low';
}

interface SortConfig {
  key: 'name' | 'createdAt' | 'aiPriorityScore' | 'budget';
  direction: 'asc' | 'desc';
}

const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { leads, leadViewMode, setLeadViewMode, isOffline } = useCrmStore();

  // Enhanced state management
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    source: 'all',
    dateRange: 'all',
    assignee: 'all',
    priority: 'all',
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'desc',
  });

  // Memoized filtering logic
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch =
        !searchTerm ||
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.includes(searchTerm);

      const matchesStatus =
        filters.status === 'all' || lead.status === filters.status;

      const matchesSource =
        filters.source === 'all' || lead.source === filters.source;

      const matchesPriority = (() => {
        if (filters.priority === 'all') {
          return true;
        }
        const score = lead.aiPriorityScore || 0;
        switch (filters.priority) {
          case 'high':
            return score >= 0.7;
          case 'medium':
            return score >= 0.4 && score < 0.7;
          case 'low':
            return score < 0.4;
          default:
            return true;
        }
      })();

      const matchesDateRange = (() => {
        if (filters.dateRange === 'all') {
          return true;
        }
        const createdAt = new Date(lead.createdAt);
        const now = new Date();
        switch (filters.dateRange) {
          case 'today':
            return createdAt.toDateString() === now.toDateString();
          case 'week': {
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            return createdAt >= weekAgo;
          }
          case 'month': {
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            return createdAt >= monthAgo;
          }
          default:
            return true;
        }
      })();

      const matchesAssignee =
        filters.assignee === 'all' || lead.assignedTo === filters.assignee;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSource &&
        matchesPriority &&
        matchesDateRange &&
        matchesAssignee
      );
    });
  }, [leads, searchTerm, filters]);

  // Memoized sorting logic
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      switch (sortConfig.key) {
        case 'name':
          return direction * a.name.localeCompare(b.name);
        case 'createdAt':
          return (
            direction *
            (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          );
        case 'aiPriorityScore':
          return (
            direction * ((a.aiPriorityScore || 0) - (b.aiPriorityScore || 0))
          );
        case 'budget':
          return direction * ((a.budget || 0) - (b.budget || 0));
        default:
          return 0;
      }
    });
  }, [filteredLeads, sortConfig]);

  // Handler functions
  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: string) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleSortChange = useCallback((key: SortConfig['key']) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Leads</h1>
          <p className='text-muted-foreground'>
            Manage and track your potential clients
          </p>
        </div>

        <div className='flex gap-2'>
          <Button
            disabled={isOffline}
            onClick={() => navigate({ to: '/crm/leads/new' })}
          >
            <Plus className='mr-2 h-4 w-4' />
            Add Lead
          </Button>

          <BulkUploadModal />
        </div>
      </div>

      <div className='flex flex-col md:flex-row gap-4 items-start md:items-center'>
        <div className='relative w-full md:w-96'>
          <User className='absolute left-2.5 top-2.5 h-4 w-4 text-gray-500' />
          <Input
            type='search'
            placeholder='Search leads...'
            className='w-full pl-9 bg-white'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className='flex flex-wrap gap-2'>
          {/* Enhanced Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm'>
                <Filter className='mr-2 h-4 w-4' />
                Filters (
                {Object.values(filters).filter(v => v !== 'all').length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56' align='end'>
              <div className='px-2 py-1.5 text-sm font-semibold'>Status</div>
              <DropdownMenuItem
                onClick={() => handleFilterChange('status', 'all')}
                className={filters.status === 'all' ? 'bg-muted' : ''}
              >
                All Statuses
              </DropdownMenuItem>
              {Object.values(LeadStatus).map(status => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleFilterChange('status', status)}
                  className={filters.status === status ? 'bg-muted' : ''}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </DropdownMenuItem>
              ))}

              <Separator className='my-2' />
              <div className='px-2 py-1.5 text-sm font-semibold'>Source</div>
              <DropdownMenuItem
                onClick={() => handleFilterChange('source', 'all')}
                className={filters.source === 'all' ? 'bg-muted' : ''}
              >
                All Sources
              </DropdownMenuItem>
              {Object.values(LeadSource).map(source => (
                <DropdownMenuItem
                  key={source}
                  onClick={() => handleFilterChange('source', source)}
                  className={filters.source === source ? 'bg-muted' : ''}
                >
                  {source.charAt(0).toUpperCase() + source.slice(1)}
                </DropdownMenuItem>
              ))}

              <Separator className='my-2' />
              <div className='px-2 py-1.5 text-sm font-semibold'>Priority</div>
              <DropdownMenuItem
                onClick={() => handleFilterChange('priority', 'all')}
                className={filters.priority === 'all' ? 'bg-muted' : ''}
              >
                All Priorities
              </DropdownMenuItem>
              {['high', 'medium', 'low'].map(priority => (
                <DropdownMenuItem
                  key={priority}
                  onClick={() => handleFilterChange('priority', priority)}
                  className={filters.priority === priority ? 'bg-muted' : ''}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </DropdownMenuItem>
              ))}

              <Separator className='my-2' />
              <div className='px-2 py-1.5 text-sm font-semibold'>
                Date Range
              </div>
              <DropdownMenuItem
                onClick={() => handleFilterChange('dateRange', 'all')}
                className={filters.dateRange === 'all' ? 'bg-muted' : ''}
              >
                All Time
              </DropdownMenuItem>
              {['today', 'week', 'month'].map(range => (
                <DropdownMenuItem
                  key={range}
                  onClick={() => handleFilterChange('dateRange', range)}
                  className={filters.dateRange === range ? 'bg-muted' : ''}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Enhanced Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm'>
                <ArrowUpDown className='mr-2 h-4 w-4' />
                Sort: {sortConfig.key} ({sortConfig.direction})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <div className='px-2 py-1.5 text-sm font-semibold'>Sort By</div>
              {[
                { key: 'name', label: 'Name' },
                { key: 'createdAt', label: 'Created Date' },
                { key: 'aiPriorityScore', label: 'Priority Score' },
                { key: 'budget', label: 'Budget' },
              ].map(option => (
                <DropdownMenuItem
                  key={option.key}
                  onClick={() =>
                    handleSortChange(option.key as SortConfig['key'])
                  }
                  className={sortConfig.key === option.key ? 'bg-muted' : ''}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className='border rounded-md flex'>
            <Button
              variant={leadViewMode === 'list' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setLeadViewMode('list')}
              className='rounded-r-none'
            >
              <List className='h-4 w-4' />
              <span className='sr-only'>List view</span>
            </Button>
            <Separator orientation='vertical' className='h-8' />
            <Button
              variant={leadViewMode === 'kanban' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setLeadViewMode('kanban')}
              className='rounded-l-none '
            >
              <LayoutGrid className='h-4 w-4' />
              <span className='sr-only'>Kanban view</span>
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue='all' className='w-full'>
        <TabsList className='grid grid-cols-4 sm:grid-cols-7'>
          <TabsTrigger value='all'>All</TabsTrigger>
          <TabsTrigger value='new'>New</TabsTrigger>
          <TabsTrigger value='contacted'>Contacted</TabsTrigger>
          <TabsTrigger value='qualified'>Qualified</TabsTrigger>
          <TabsTrigger value='proposal' className='hidden sm:inline-flex'>
            Proposal
          </TabsTrigger>
          <TabsTrigger value='negotiation' className='hidden sm:inline-flex'>
            Negotiation
          </TabsTrigger>
          <TabsTrigger value='booked' className='hidden sm:inline-flex'>
            Booked
          </TabsTrigger>
        </TabsList>
        <TabsContent value='all' className='mt-4'>
          {leadViewMode === 'list' ? (
            <LeadListView leads={sortedLeads} />
          ) : (
            <LeadKanbanView leads={sortedLeads} />
          )}
        </TabsContent>
        <TabsContent value='new' className='mt-4'>
          {leadViewMode === 'list' ? (
            <LeadListView
              leads={sortedLeads.filter(l => l.status === LeadStatus.NEW)}
            />
          ) : (
            <LeadKanbanView
              leads={sortedLeads.filter(l => l.status === LeadStatus.NEW)}
            />
          )}
        </TabsContent>
        <TabsContent value='contacted' className='mt-4'>
          {leadViewMode === 'list' ? (
            <LeadListView
              leads={sortedLeads.filter(l => l.status === LeadStatus.CONTACTED)}
            />
          ) : (
            <LeadKanbanView
              leads={sortedLeads.filter(l => l.status === LeadStatus.CONTACTED)}
            />
          )}
        </TabsContent>
        <TabsContent value='qualified' className='mt-4'>
          {leadViewMode === 'list' ? (
            <LeadListView
              leads={sortedLeads.filter(l => l.status === LeadStatus.QUALIFIED)}
            />
          ) : (
            <LeadKanbanView
              leads={sortedLeads.filter(l => l.status === LeadStatus.QUALIFIED)}
            />
          )}
        </TabsContent>
        <TabsContent value='proposal' className='mt-4'>
          {leadViewMode === 'list' ? (
            <LeadListView
              leads={sortedLeads.filter(l => l.status === LeadStatus.PROPOSAL)}
            />
          ) : (
            <LeadKanbanView
              leads={sortedLeads.filter(l => l.status === LeadStatus.PROPOSAL)}
            />
          )}
        </TabsContent>
        <TabsContent value='negotiation' className='mt-4'>
          {leadViewMode === 'list' ? (
            <LeadListView
              leads={sortedLeads.filter(
                l => l.status === LeadStatus.NEGOTIATION
              )}
            />
          ) : (
            <LeadKanbanView
              leads={sortedLeads.filter(
                l => l.status === LeadStatus.NEGOTIATION
              )}
            />
          )}
        </TabsContent>
        <TabsContent value='booked' className='mt-4'>
          {leadViewMode === 'list' ? (
            <LeadListView
              leads={sortedLeads.filter(l => l.status === LeadStatus.BOOKED)}
            />
          ) : (
            <LeadKanbanView
              leads={sortedLeads.filter(l => l.status === LeadStatus.BOOKED)}
            />
          )}
        </TabsContent>
      </Tabs>

      {filteredLeads.length === 0 && (
        <Card className='bg-gray-50 border-dashed'>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-xl'>No leads found</CardTitle>
            <CardDescription>
              There are no leads matching your current filters.
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col items-center justify-center py-8 space-y-4'>
            <div className='rounded-full bg-muted p-6'>
              <AlertTriangle className='h-12 w-12 text-muted-foreground' />
            </div>
            <div className='text-center space-y-2'>
              <p>Try adjusting your search or filter settings</p>
            </div>
          </CardContent>
          <CardFooter className='flex justify-center border-t pt-6 pb-4 space-x-2'>
            <Button
              variant='outline'
              onClick={() => navigate({ to: '/crm/leads/new' })}
            >
              <FilePlus className='mr-2 h-4 w-4' />
              Create New Lead
            </Button>
            <Button variant='outline' onClick={() => {}}>
              <FileText className='mr-2 h-4 w-4' />
              Import Leads
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default LeadsPage;
