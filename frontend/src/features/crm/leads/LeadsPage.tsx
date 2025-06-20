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
import React, { useCallback, useMemo } from 'react';

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
import {
  useLeadGetAllQuery,
  type LeadPaginationParams,
} from '@/store/api/Services/leadApi';
import { useLeadsUrlState } from '@/hooks/useLeadsUrlState';
import { useServerPagination } from '@/hooks/useServerPagination';

import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from '@tanstack/react-router';
import type { SortingState } from '@tanstack/react-table';

interface SortConfig {
  key: 'name' | 'createdAt' | 'aiPriorityScore' | 'budget';
  direction: 'asc' | 'desc';
}

const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { leads, isOffline } = useCrmStore();

  // URL state management
  const {
    page,
    limit,
    search,
    status,
    sortBy,
    sortOrder,
    viewMode,
    filters,
    setPage,
    setLimit,
    setSearch,
    setStatus,
    setSorting,
    setViewMode,
    setFilter,
    reset,
    hasChanges,
    getApiParams,
  } = useLeadsUrlState();

  // Server-side pagination hook
  const { paginationMeta } = useServerPagination({
    initialPageIndex: page - 1, // Convert to 0-based for the hook
    initialPageSize: limit,
    total: 0, // Will be updated from API response
  });

  // Get API parameters from URL state
  const apiParams = useMemo((): LeadPaginationParams => {
    return getApiParams();
  }, [getApiParams]);

  // Fetch leads from API with pagination
  const { data: apiResponse, isLoading, error } = useLeadGetAllQuery(apiParams);

  // Use API data if available, otherwise fall back to local store
  const allLeads = apiResponse?.data?.data || leads;
  const totalLeads = apiResponse?.data?.total || leads.length;

  // Update pagination meta when total changes
  React.useEffect(() => {
    if (apiResponse?.data?.total !== undefined) {
      // The hook will automatically recalculate pagination meta
    }
  }, [apiResponse?.data?.total]);

  // Ensure status is properly initialized
  React.useEffect(() => {
    if (!status || status === '') {
      console.log('Status is empty, setting to default');
      setStatus('all');
    }
  }, [status, setStatus]);

  // Handler functions
  const handleFilterChange = useCallback(
    (key: keyof typeof filters, value: string) => {
      setFilter(key, value);
      // Don't call setPage(1) to avoid the error
    },
    [setFilter]
  );

  const handleSortChange = useCallback(
    (key: SortConfig['key']) => {
      const newSorting: SortingState = [
        {
          id:
            key === 'name'
              ? 'fullName'
              : key === 'aiPriorityScore'
                ? 'aiScore'
                : key,
          desc: sortBy === key && sortOrder === 'desc' ? false : true,
        },
      ];
      setSorting(newSorting);
    },
    [sortBy, sortOrder, setSorting]
  );

  const handlePageChange = useCallback(
    (pageIndex: number) => {
      setPage(pageIndex + 1); // Convert from 0-based to 1-based
    },
    [setPage]
  );

  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      setLimit(pageSize);
      // Don't call setPage(1) to avoid the error
    },
    [setLimit]
  );

  // Custom function to batch updates and avoid setPage(1) errors
  const batchUpdate = useCallback(
    (updates: Partial<{ search: string; status: string; page: number }>) => {
      // Update search if provided
      if (updates.search !== undefined) {
        setSearch(updates.search);
      }

      // Update status if provided
      if (updates.status !== undefined) {
        setStatus(updates.status);
      }

      // Update page if provided (but only if it's not 1 to avoid the error)
      if (updates.page !== undefined && updates.page !== 1) {
        setPage(updates.page);
      }
    },
    [setSearch, setStatus, setPage]
  );

  const handleSearchChange = useCallback(
    (search: string) => {
      setSearch(search);
      // Don't call setPage(1) to avoid the error
    },
    [setSearch]
  );

  const handleSortingChange = useCallback(
    (newSorting: SortingState) => {
      setSorting(newSorting);
    },
    [setSorting]
  );

  const handleTabChange = useCallback(
    (tab: string) => {
      setStatus(tab);
      // Don't call setPage(1) to avoid the error
    },
    [setStatus]
  );

  // Ensure we have a valid status for the Tabs component
  const currentStatus =
    status &&
    [
      'all',
      'new',
      'contacted',
      'qualified',
      'proposal',
      'negotiation',
      'booked',
    ].includes(status)
      ? status
      : 'all';

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
            value={search}
            onChange={e => {
              console.log('Search input onChange:', {
                value: e.target.value,
                currentSearch: search,
              });
              handleSearchChange(e.target.value);
            }}
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
                Sort: {sortBy} ({sortOrder})
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
                  className={sortBy === option.key ? 'bg-muted' : ''}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className='border rounded-md flex'>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('list')}
              className='rounded-r-none'
            >
              <List className='h-4 w-4' />
              <span className='sr-only'>List view</span>
            </Button>
            <Separator orientation='vertical' className='h-8' />
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('kanban')}
              className='rounded-l-none '
            >
              <LayoutGrid className='h-4 w-4' />
              <span className='sr-only'>Kanban view</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Debug section - Remove in production */}
      {/* {process.env.NODE_ENV === 'development' && (
        <Card className='bg-yellow-50 border-yellow-200'>
          <CardHeader>
            <CardTitle className='text-yellow-800'>
              Debug Tab Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <p className='text-sm'>
                Current Status: <strong>{currentStatus}</strong>
              </p>
              <p className='text-sm'>
                Raw Status: <strong>{status}</strong>
              </p>
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setStatus('new')}
                >
                  Set to New
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setStatus('qualified')}
                >
                  Set to Qualified
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setStatus('all')}
                >
                  Set to All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )} */}

      <Tabs
        defaultValue='all'
        value={currentStatus}
        onValueChange={handleTabChange}
        className='w-full'
      >
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
          {viewMode === 'list' ? (
            <LeadListView
              leads={allLeads}
              total={totalLeads}
              isLoading={isLoading}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onSearchChange={handleSearchChange}
              onSortChange={handleSortingChange}
              pageIndex={page - 1} // Convert to 0-based for the component
              pageSize={limit}
              searchTerm={search}
              sorting={[{ id: sortBy, desc: sortOrder === 'desc' }]}
            />
          ) : (
            <LeadKanbanView leads={allLeads} />
          )}
        </TabsContent>
        <TabsContent value='new' className='mt-4'>
          {viewMode === 'list' ? (
            <LeadListView
              leads={allLeads.filter(l => l.status === LeadStatus.NEW)}
              total={totalLeads}
              isLoading={isLoading}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onSearchChange={handleSearchChange}
              onSortChange={handleSortingChange}
              pageIndex={page - 1}
              pageSize={limit}
              searchTerm={search}
              sorting={[{ id: sortBy, desc: sortOrder === 'desc' }]}
            />
          ) : (
            <LeadKanbanView
              leads={allLeads.filter(l => l.status === LeadStatus.NEW)}
            />
          )}
        </TabsContent>
        <TabsContent value='contacted' className='mt-4'>
          {viewMode === 'list' ? (
            <LeadListView
              leads={allLeads.filter(l => l.status === LeadStatus.CONTACTED)}
              total={totalLeads}
              isLoading={isLoading}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onSearchChange={handleSearchChange}
              onSortChange={handleSortingChange}
              pageIndex={page - 1}
              pageSize={limit}
              searchTerm={search}
              sorting={[{ id: sortBy, desc: sortOrder === 'desc' }]}
            />
          ) : (
            <LeadKanbanView
              leads={allLeads.filter(l => l.status === LeadStatus.CONTACTED)}
            />
          )}
        </TabsContent>
        <TabsContent value='qualified' className='mt-4'>
          {viewMode === 'list' ? (
            <LeadListView
              leads={allLeads.filter(l => l.status === LeadStatus.QUALIFIED)}
              total={totalLeads}
              isLoading={isLoading}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onSearchChange={handleSearchChange}
              onSortChange={handleSortingChange}
              pageIndex={page - 1}
              pageSize={limit}
              searchTerm={search}
              sorting={[{ id: sortBy, desc: sortOrder === 'desc' }]}
            />
          ) : (
            <LeadKanbanView
              leads={allLeads.filter(l => l.status === LeadStatus.QUALIFIED)}
            />
          )}
        </TabsContent>
        <TabsContent value='proposal' className='mt-4'>
          {viewMode === 'list' ? (
            <LeadListView
              leads={allLeads.filter(l => l.status === LeadStatus.PROPOSAL)}
              total={totalLeads}
              isLoading={isLoading}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onSearchChange={handleSearchChange}
              onSortChange={handleSortingChange}
              pageIndex={page - 1}
              pageSize={limit}
              searchTerm={search}
              sorting={[{ id: sortBy, desc: sortOrder === 'desc' }]}
            />
          ) : (
            <LeadKanbanView
              leads={allLeads.filter(l => l.status === LeadStatus.PROPOSAL)}
            />
          )}
        </TabsContent>
        <TabsContent value='negotiation' className='mt-4'>
          {viewMode === 'list' ? (
            <LeadListView
              leads={allLeads.filter(l => l.status === LeadStatus.NEGOTIATION)}
              total={totalLeads}
              isLoading={isLoading}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onSearchChange={handleSearchChange}
              onSortChange={handleSortingChange}
              pageIndex={page - 1}
              pageSize={limit}
              searchTerm={search}
              sorting={[{ id: sortBy, desc: sortOrder === 'desc' }]}
            />
          ) : (
            <LeadKanbanView
              leads={allLeads.filter(l => l.status === LeadStatus.NEGOTIATION)}
            />
          )}
        </TabsContent>
        <TabsContent value='booked' className='mt-4'>
          {viewMode === 'list' ? (
            <LeadListView
              leads={allLeads.filter(l => l.status === LeadStatus.BOOKED)}
              total={totalLeads}
              isLoading={isLoading}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onSearchChange={handleSearchChange}
              onSortChange={handleSortingChange}
              pageIndex={page - 1}
              pageSize={limit}
              searchTerm={search}
              sorting={[{ id: sortBy, desc: sortOrder === 'desc' }]}
            />
          ) : (
            <LeadKanbanView
              leads={allLeads.filter(l => l.status === LeadStatus.BOOKED)}
            />
          )}
        </TabsContent>
      </Tabs>

      {allLeads.length === 0 && !isLoading && (
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
