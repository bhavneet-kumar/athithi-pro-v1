import {
  User,
  Plus,
  List,
  LayoutGrid,
  Filter,
  ArrowUpDown,
  FilePlus,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BulkUploadModal from './BulkUploadModal';
import LeadKanbanView from './LeadKanbanView';
import LeadListView from './LeadListView';

import { Badge } from '@/components/ui/badge';
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
import { LeadStatus } from '@/types/crm';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { leads, leadViewMode, setLeadViewMode, isOffline } = useCrmStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');

  // Filter leads based on search term and status filter
  const filteredLeads = leads.filter(lead => {
    const matchesSearch =
      searchTerm === '' ||
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm);

    const matchesStatus =
      statusFilter === 'all' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
            onClick={() => navigate('/crm/leads/new')}
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

        <div className='flex gap-2 self-start'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm'>
                <Filter className='mr-2 h-4 w-4' />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                All Statuses
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter(LeadStatus.NEW)}>
                New Leads
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter(LeadStatus.CONTACTED)}
              >
                Contacted
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter(LeadStatus.QUALIFIED)}
              >
                Qualified
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter(LeadStatus.PROPOSAL)}
              >
                Proposal Sent
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter(LeadStatus.NEGOTIATION)}
              >
                In Negotiation
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter(LeadStatus.BOOKED)}
              >
                Booked
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter(LeadStatus.LOST)}
              >
                Lost
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm'>
                <ArrowUpDown className='mr-2 h-4 w-4' />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem>Newest First</DropdownMenuItem>
              <DropdownMenuItem>Oldest First</DropdownMenuItem>
              <DropdownMenuItem>A-Z by Name</DropdownMenuItem>
              <DropdownMenuItem>Priority Score (High to Low)</DropdownMenuItem>
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
              className='rounded-l-none'
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
            <LeadListView leads={filteredLeads} />
          ) : (
            <LeadKanbanView leads={filteredLeads} />
          )}
        </TabsContent>
        <TabsContent value='new' className='mt-4'>
          {leadViewMode === 'list' ? (
            <LeadListView
              leads={filteredLeads.filter(l => l.status === LeadStatus.NEW)}
            />
          ) : (
            <LeadKanbanView
              leads={filteredLeads.filter(l => l.status === LeadStatus.NEW)}
            />
          )}
        </TabsContent>
        <TabsContent value='contacted' className='mt-4'>
          {leadViewMode === 'list' ? (
            <LeadListView
              leads={filteredLeads.filter(
                l => l.status === LeadStatus.CONTACTED
              )}
            />
          ) : (
            <LeadKanbanView
              leads={filteredLeads.filter(
                l => l.status === LeadStatus.CONTACTED
              )}
            />
          )}
        </TabsContent>
        <TabsContent value='qualified' className='mt-4'>
          {leadViewMode === 'list' ? (
            <LeadListView
              leads={filteredLeads.filter(
                l => l.status === LeadStatus.QUALIFIED
              )}
            />
          ) : (
            <LeadKanbanView
              leads={filteredLeads.filter(
                l => l.status === LeadStatus.QUALIFIED
              )}
            />
          )}
        </TabsContent>
        <TabsContent value='proposal' className='mt-4'>
          {leadViewMode === 'list' ? (
            <LeadListView
              leads={filteredLeads.filter(
                l => l.status === LeadStatus.PROPOSAL
              )}
            />
          ) : (
            <LeadKanbanView
              leads={filteredLeads.filter(
                l => l.status === LeadStatus.PROPOSAL
              )}
            />
          )}
        </TabsContent>
        <TabsContent value='negotiation' className='mt-4'>
          {leadViewMode === 'list' ? (
            <LeadListView
              leads={filteredLeads.filter(
                l => l.status === LeadStatus.NEGOTIATION
              )}
            />
          ) : (
            <LeadKanbanView
              leads={filteredLeads.filter(
                l => l.status === LeadStatus.NEGOTIATION
              )}
            />
          )}
        </TabsContent>
        <TabsContent value='booked' className='mt-4'>
          {leadViewMode === 'list' ? (
            <LeadListView
              leads={filteredLeads.filter(l => l.status === LeadStatus.BOOKED)}
            />
          ) : (
            <LeadKanbanView
              leads={filteredLeads.filter(l => l.status === LeadStatus.BOOKED)}
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
              onClick={() => navigate('/crm/leads/new')}
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
