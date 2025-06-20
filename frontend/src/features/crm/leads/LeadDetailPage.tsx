import { format, isValid, parseISO } from 'date-fns';
import {
  ArrowLeft,
  BadgeIndianRupee,
  Calendar,
  ClipboardList,
  Clock,
  DollarSign,
  Edit,
  FileCheck,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Tag,
  Trash2,
  User,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrency } from '@/hooks/useCurrency';
import { useLeadSuggestions } from '@/hooks/useLeadSuggestions';
import { useCrmStore } from '@/lib/store';
import {
  useLeadGetByIdQuery,
  useLeadChangeStatusMutation,
} from '@/store/api/Services/leadApi';
import {
  generateMockLeadData,
  generateMockCommunications,
  generateMockTasks,
  generateMockBookings,
} from '@/utils/mockData';

import { toast } from '@/hooks/use-toast';
import { LeadStatus } from '@/types/crm';

// Helper function to safely format dates
const safeFormat = (
  date: Date | string | undefined,
  formatStr: string,
  fallback = 'N/A'
): string => {
  if (!date) {
    return fallback;
  }

  // If it's a string, try to parse it
  let dateObj: Date;
  if (typeof date === 'string') {
    dateObj = parseISO(date);
  } else {
    dateObj = date;
  }

  return isValid(dateObj) ? format(dateObj, formatStr) : fallback;
};

const LeadDetailPage: React.FC = () => {
  const { id } = useParams({
    from: '/_app/crm/leads/$id',
  });
  const navigate = useNavigate();
  const {
    leads,
    communications,
    tasks,
    bookings,
    deleteLead,
    updateLead,
    isOffline,
  } = useCrmStore();
  const [currentStatus, setCurrentStatus] = useState<LeadStatus | null>(null);

  // API mutations
  const [leadChangeStatus] = useLeadChangeStatusMutation();

  // API call to get lead by ID - this should be called first
  const {
    data: apiResponse,
    isLoading,
    error,
    refetch,
  } = useLeadGetByIdQuery(id!, {
    skip: !id,
    // Add polling to ensure data is fetched
    pollingInterval: 0, // Disable polling
  });

  // Combine API data with mock data for missing fields
  const [assembledLead, setAssembledLead] = useState<any>(null);
  const [assembledCommunications, setAssembledCommunications] = useState<any[]>(
    []
  );
  const [assembledTasks, setAssembledTasks] = useState<any[]>([]);
  const [assembledBookings, setAssembledBookings] = useState<any[]>([]);

  // Assemble data when API response is received
  useEffect(() => {
    console.log('API Response effect triggered:', { apiResponse, error });

    if (apiResponse?.data) {
      console.log('API Response received:', apiResponse);
      const apiLead = apiResponse.data;

      // Generate mock data for missing fields
      const enhancedLead = generateMockLeadData(apiLead);
      console.log('Enhanced lead data:', enhancedLead);
      setAssembledLead(enhancedLead);

      // Generate mock data for related entities
      setAssembledCommunications(generateMockCommunications(apiLead._id));
      setAssembledTasks(generateMockTasks(apiLead._id));
      setAssembledBookings(generateMockBookings(apiLead._id));
    } else if (error) {
      console.error('API Error:', error);
    }
  }, [apiResponse, error]);

  // Fallback to local store if API fails or offline
  const localLead = leads.find(l => l._id === id || (l as any).id === id);
  const lead = assembledLead || localLead;

  // Use the hook to get suggestions instead of local state
  const {
    suggestions,
    isLoading: suggestionsLoading,
    error: suggestionsError,
    loadSuggestions,
  } = useLeadSuggestions(id);

  // Currency formatting helper
  const { formatCurrency, getCurrencyIconName } = useCurrency();

  const formattedBudget = lead?.travelDetails?.budget
    ? formatCurrency(
        lead.travelDetails.budget.currency,
        lead.travelDetails.budget.value
      )
    : undefined;

  // We'll keep the old loadAiSuggestions function for backward compatibility
  // but it will use our new hook
  const loadAiSuggestions = async () => {
    if (!lead) {
      return;
    }
    await loadSuggestions();
  };

  // Load AI suggestions for this lead on initial render
  useEffect(() => {
    if (lead) {
      loadAiSuggestions();
    }
  }, [lead]);

  // Debug logging
  useEffect(() => {
    console.log('LeadDetailPage Debug Info:', {
      id,
      apiResponse,
      assembledLead,
      localLead,
      lead,
      isLoading,
      error,
      isOffline,
    });
  }, [
    id,
    apiResponse,
    assembledLead,
    localLead,
    lead,
    isLoading,
    error,
    isOffline,
  ]);

  // Test API call on mount
  useEffect(() => {
    if (id) {
      console.log('Testing API call for lead ID:', id);
      console.log('API URL would be: http://localhost:3000/api/v1/leads/' + id);
    }
  }, [id]);

  // Manual API test function
  const testApiCall = async () => {
    try {
      console.log('Testing manual API call...');
      const response = await fetch(`http://localhost:3000/api/v1/leads/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
        },
        credentials: 'include',
      });

      console.log('Manual API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Manual API Data:', data);
      } else {
        console.error(
          'Manual API Error:',
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error('Manual API Test Error:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center h-[70vh]'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900'></div>
        <h2 className='text-2xl font-bold mt-4'>Loading Lead...</h2>
        <p className='text-muted-foreground mt-2'>
          Fetching lead data from server...
        </p>
      </div>
    );
  }

  // Error state
  if (error && !localLead) {
    return (
      <div className='flex flex-col items-center justify-center h-[70vh]'>
        <h2 className='text-2xl font-bold'>Error Loading Lead</h2>
        <p className='text-muted-foreground mt-2'>
          There was an error loading the lead data.
        </p>
        {error && (
          <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md'>
            <p className='text-sm text-red-600'>
              <strong>Error Details:</strong>
            </p>
            <p className='text-xs text-red-500 mt-1'>
              {JSON.stringify(error, null, 2)}
            </p>
          </div>
        )}
        <div className='flex gap-2 mt-4'>
          <Button onClick={() => refetch()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Retry
          </Button>
          <Button
            variant='outline'
            onClick={() => navigate({ to: '/crm/leads' })}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className='flex flex-col items-center justify-center h-[70vh]'>
        <h2 className='text-2xl font-bold'>Lead Not Found</h2>
        <p className='text-muted-foreground mt-2'>
          The lead you're looking for doesn't exist.
        </p>
        <Button className='mt-4' onClick={() => navigate({ to: '/crm/leads' })}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Leads
        </Button>
      </div>
    );
  }

  // Find related data - use assembled data or fallback to local store
  const leadCommunications =
    assembledCommunications.length > 0
      ? assembledCommunications
      : communications.filter(
          c => c.leadId === lead._id || c.leadId === lead.id
        );
  const leadTasks =
    assembledTasks.length > 0
      ? assembledTasks
      : tasks.filter(t => t.leadId === lead._id || t.leadId === lead.id);
  const leadBookings =
    assembledBookings.length > 0
      ? assembledBookings
      : bookings.filter(b => b.leadId === lead._id || b.leadId === lead.id);

  const handleStatusChange = async (status: LeadStatus) => {
    if (isOffline) {
      toast({
        title: 'Offline Mode',
        description: "Status changes will be synced when you're back online.",
        variant: 'default',
      });
      // Update local store when offline
      updateLead(lead._id || lead.id, { status });
      setCurrentStatus(status);
      return;
    }

    try {
      // Call API when online
      await leadChangeStatus({
        id: lead._id,
        status: status,
      }).unwrap();

      // Also update local store for immediate UI update
      updateLead(lead._id, { status });
      setCurrentStatus(status);

      toast({
        title: 'Status Updated',
        description: `Lead status has been updated to ${status}.`,
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Error updating lead status:', error);
      toast({
        title: 'Error',
        description:
          error?.data?.message ||
          'Failed to update lead status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLead = () => {
    if (isOffline) {
      toast({
        title: 'Offline Mode',
        description: "This lead will be deleted when you're back online.",
        variant: 'default',
      });
    }

    deleteLead(lead._id || lead.id);
    navigate({ to: '/crm/leads' });
    toast({
      title: 'Lead Deleted',
      description: 'The lead has been successfully deleted.',
      variant: 'default',
    });
  };

  const getStatusBadgeClass = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.NEW:
        return 'bg-blue-100 text-blue-800';
      case LeadStatus.CONTACTED:
        return 'bg-purple-100 text-purple-800';
      case LeadStatus.QUALIFIED:
        return 'bg-green-100 text-green-800';
      case LeadStatus.PROPOSAL:
        return 'bg-yellow-100 text-yellow-800';
      case LeadStatus.NEGOTIATION:
        return 'bg-orange-100 text-orange-800';
      case LeadStatus.BOOKED:
        return 'bg-green-100 text-green-800';
      case LeadStatus.LOST:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Create timeline items with proper type guards
  interface TimelineItem {
    type: 'communication' | 'task' | 'booking';
    date: Date;
    data: any;
  }

  // Process timeline items with date validation
  const timelineItems: TimelineItem[] = [];

  // Add communications with date validation
  leadCommunications.forEach(comm => {
    try {
      const date =
        typeof comm.sentAt === 'string' ? new Date(comm.sentAt) : comm.sentAt;
      if (isValid(date)) {
        timelineItems.push({
          type: 'communication' as const,
          date,
          data: comm,
        });
      }
    } catch (e) {
      console.error('Invalid date for communication:', comm.id);
    }
  });

  // Add tasks with date validation
  leadTasks
    .filter(t => t.completed)
    .forEach(task => {
      try {
        const date = task.completedAt
          ? typeof task.completedAt === 'string'
            ? new Date(task.completedAt)
            : task.completedAt
          : typeof task.updatedAt === 'string'
            ? new Date(task.updatedAt)
            : task.updatedAt;

        if (isValid(date)) {
          timelineItems.push({
            type: 'task' as const,
            date,
            data: task,
          });
        }
      } catch (e) {
        console.error('Invalid date for task:', task.id);
      }
    });

  // Add bookings with date validation
  leadBookings.forEach(booking => {
    try {
      const date =
        typeof booking.createdAt === 'string'
          ? new Date(booking.createdAt)
          : booking.createdAt;
      if (isValid(date)) {
        timelineItems.push({
          type: 'booking' as const,
          date,
          data: booking,
        });
      }
    } catch (e) {
      console.error('Invalid date for booking:', booking.id);
    }
  });

  // Sort items by date
  timelineItems.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className='space-y-6'>
      {/* Debug Section - Remove in production */}
      {/* {process.env.NODE_ENV === 'development' && (
        <Card className='bg-yellow-50 border-yellow-200'>
          <CardHeader>
            <CardTitle className='text-yellow-800'>Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
              <div>
                <strong>API State:</strong>
                <ul className='mt-1 space-y-1'>
                  <li>Loading: {isLoading ? 'Yes' : 'No'}</li>
                  <li>Has Error: {error ? 'Yes' : 'No'}</li>
                  <li>Has API Response: {apiResponse ? 'Yes' : 'No'}</li>
                  <li>Has Assembled Lead: {assembledLead ? 'Yes' : 'No'}</li>
                  <li>Has Local Lead: {localLead ? 'Yes' : 'No'}</li>
                  <li>Final Lead: {lead ? 'Yes' : 'No'}</li>
                </ul>
              </div>
              <div>
                <strong>Lead ID:</strong> {id}
                <br />
                <strong>API URL:</strong> leads/{id}
                <br />
                <strong>Offline Mode:</strong> {isOffline ? 'Yes' : 'No'}
              </div>
            </div>
            <div className='mt-4 flex gap-2'>
              <Button size='sm' onClick={() => refetch()}>
                <RefreshCw className='mr-2 h-3 w-3' />
                Refetch API
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() =>
                  console.log('Debug Info:', {
                    id,
                    apiResponse,
                    assembledLead,
                    localLead,
                    lead,
                    error,
                  })
                }
              >
                Log Debug Info
              </Button>
              <Button size='sm' variant='outline' onClick={testApiCall}>
                Test Manual API
              </Button>
            </div>
          </CardContent>
        </Card>
      )} */}

      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div className='flex items-center'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => navigate({ to: '/crm/leads' })}
            className='mr-2'
          >
            <ArrowLeft className='h-4 w-4 mr-1' />
            Back
          </Button>
          <h1 className='text-2xl font-bold tracking-tight'>{lead.fullName}</h1>
          <Badge
            variant='outline'
            className={`ml-3 ${getStatusBadgeClass(lead.status)}`}
          >
            {lead.status}
          </Badge>
          {lead.isReturnCustomer && (
            <Badge variant='outline' className='ml-2 bg-[#9b87f5] text-white'>
              Return Customer
            </Badge>
          )}
        </div>

        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() =>
              navigate({ to: `/crm/communication/new/${lead._id || lead.id}` })
            }
            disabled={isOffline}
          >
            <MessageSquare className='mr-2 h-4 w-4' />
            Message
          </Button>
          <Button
            variant='outline'
            onClick={() =>
              navigate({ to: `/crm/tasks/new/${lead._id || lead.id}` })
            }
            disabled={isOffline}
          >
            <ClipboardList className='mr-2 h-4 w-4' />
            Add Task
          </Button>
          <Button
            variant='outline'
            onClick={() =>
              navigate({ to: `/crm/bookings/new/${lead._id || lead.id}` })
            }
            disabled={isOffline}
          >
            <FileCheck className='mr-2 h-4 w-4' />
            Create Booking
          </Button>
          <Button
            onClick={() => {
              console.log('Edit lead:', lead?._id);
              navigate({ to: `/crm/leads/edit/${lead._id}` });
            }}
            disabled={isOffline}
          >
            <Edit className='mr-2 h-4 w-4' />
            Edit
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Left Column - Lead Info */}
        <div className='space-y-6 md:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-4'>
                  {lead.email && (
                    <div className='flex items-center'>
                      <Mail className='h-4 w-4 text-muted-foreground mr-2' />
                      <span className='text-sm'>{lead.email}</span>
                    </div>
                  )}
                  {lead.phone && (
                    <div className='flex items-center'>
                      <Phone className='h-4 w-4 text-muted-foreground mr-2' />
                      <span className='text-sm'>{lead.phone}</span>
                    </div>
                  )}
                  {lead.source && (
                    <div className='flex items-center'>
                      <User className='h-4 w-4 text-muted-foreground mr-2' />
                      <span className='text-sm'>Source: {lead.source}</span>
                    </div>
                  )}
                </div>

                <div className='space-y-4'>
                  {lead.travelDetails?.budget && (
                    <div className='flex items-center'>
                      {getCurrencyIconName() === 'indian-rupee' ? (
                        <BadgeIndianRupee className='h-4 w-4 text-muted-foreground mr-2' />
                      ) : (
                        <DollarSign className='h-4 w-4 text-muted-foreground mr-2' />
                      )}
                      <span className='text-sm'>Budget: {formattedBudget}</span>
                    </div>
                  )}
                  {lead.travelDetails?.departureDate && (
                    <div className='flex items-center'>
                      <Calendar className='h-4 w-4 text-muted-foreground mr-2' />
                      <span className='text-sm'>
                        Travel Dates:{' '}
                        {safeFormat(
                          lead.travelDetails.departureDate,
                          'MMM d, yyyy'
                        )}
                        {lead.travelDetails.returnDate &&
                          ` - ${safeFormat(lead.travelDetails.returnDate, 'MMM d, yyyy')}`}
                      </span>
                    </div>
                  )}
                  <div className='flex items-center'>
                    <Clock className='h-4 w-4 text-muted-foreground mr-2' />
                    <span className='text-sm'>
                      Created: {safeFormat(lead.createdAt, 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              {lead.tags && lead.tags.length > 0 && (
                <div className='mt-4'>
                  <div className='flex items-center mb-2'>
                    <Tag className='h-4 w-4 text-muted-foreground mr-2' />
                    <span className='text-sm font-medium'>Tags</span>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    {lead.tags.map(tag => (
                      <Badge key={tag} variant='secondary'>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {lead.notes && (
                <div className='mt-4 pt-4 border-t'>
                  <h4 className='text-sm font-medium mb-2'>Notes</h4>
                  <p className='text-sm text-muted-foreground whitespace-pre-wrap'>
                    {lead.notes}
                  </p>
                </div>
              )}

              {lead.travelDetails?.preferences &&
                Object.keys(lead.travelDetails.preferences).length > 0 && (
                  <div className='mt-4 pt-4 border-t'>
                    <h4 className='text-sm font-medium mb-2'>Preferences</h4>
                    <dl className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                      {Object.entries(lead.travelDetails.preferences).map(
                        ([key, value]) => (
                          <div key={key}>
                            <dt className='text-xs text-muted-foreground capitalize'>
                              {key}
                            </dt>
                            <dd className='text-sm'>{String(value)}</dd>
                          </div>
                        )
                      )}
                    </dl>
                  </div>
                )}

              {lead.isReturnCustomer &&
                lead.previousBookings &&
                lead.previousBookings.length > 0 && (
                  <div className='mt-4 pt-4 border-t'>
                    <h4 className='text-sm font-medium mb-2'>
                      Previous Bookings
                    </h4>
                    <ul className='space-y-2'>
                      {lead.previousBookings.map(bookingId => {
                        const booking = bookings.find(b => b.id === bookingId);
                        return booking ? (
                          <li
                            key={booking.id}
                            className='bg-gray-50 p-2 rounded text-sm'
                          >
                            <div className='font-medium'>
                              {booking.itinerary?.name || 'Booking'}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              {safeFormat(booking.createdAt, 'MMM d, yyyy')} - $
                              {booking.totalAmount}
                            </div>
                          </li>
                        ) : null;
                      })}
                    </ul>
                  </div>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timelineItems.length > 0 ? (
                <div className='space-y-4'>
                  {timelineItems.map((item, index) => (
                    <div key={index} className='flex'>
                      <div className='mr-4 relative'>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center
                          ${
                            item.type === 'communication'
                              ? 'bg-blue-100 text-blue-600'
                              : item.type === 'task'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-[#9b87f5]/20 text-[#9b87f5]'
                          }`}
                        >
                          {item.type === 'communication' && (
                            <MessageSquare className='h-4 w-4' />
                          )}
                          {item.type === 'task' && (
                            <ClipboardList className='h-4 w-4' />
                          )}
                          {item.type === 'booking' && (
                            <FileCheck className='h-4 w-4' />
                          )}
                        </div>
                        {index < timelineItems.length - 1 && (
                          <div className='absolute top-8 bottom-0 left-1/2 w-0.5 -ml-0.5 bg-gray-200' />
                        )}
                      </div>
                      <div className='flex-1 pb-6'>
                        <div className='text-sm font-medium'>
                          {item.type === 'communication' && 'Communication'}
                          {item.type === 'task' && 'Task Completed'}
                          {item.type === 'booking' && 'Booking Created'}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          {safeFormat(item.date, "MMM d, yyyy 'at' h:mm a")}
                        </div>
                        <div className='mt-2 p-3 bg-muted/50 rounded-md text-sm'>
                          {item.type === 'communication' && item.data.content}
                          {item.type === 'task' && item.data.title}
                          {item.type === 'booking' &&
                            `${item.data.itinerary?.name || 'Booking'} - $${item.data.totalAmount.toLocaleString()}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8 text-muted-foreground'>
                  No activity recorded for this lead yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions & Status */}
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Lead Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <Button
                  className={`w-full justify-start ${lead.status === LeadStatus.NEW ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : ''}`}
                  variant={
                    lead.status === LeadStatus.NEW ? 'secondary' : 'outline'
                  }
                  onClick={() => handleStatusChange(LeadStatus.NEW)}
                  disabled={isOffline}
                >
                  New Lead
                </Button>
                <Button
                  className={`w-full justify-start ${lead.status === LeadStatus.CONTACTED ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' : ''}`}
                  variant={
                    lead.status === LeadStatus.CONTACTED
                      ? 'secondary'
                      : 'outline'
                  }
                  onClick={() => handleStatusChange(LeadStatus.CONTACTED)}
                  disabled={isOffline}
                >
                  Contacted
                </Button>
                <Button
                  className={`w-full justify-start ${lead.status === LeadStatus.QUALIFIED ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}`}
                  variant={
                    lead.status === LeadStatus.QUALIFIED
                      ? 'secondary'
                      : 'outline'
                  }
                  onClick={() => handleStatusChange(LeadStatus.QUALIFIED)}
                  disabled={isOffline}
                >
                  Qualified
                </Button>
                <Button
                  className={`w-full justify-start ${lead.status === LeadStatus.PROPOSAL ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : ''}`}
                  variant={
                    lead.status === LeadStatus.PROPOSAL
                      ? 'secondary'
                      : 'outline'
                  }
                  onClick={() => handleStatusChange(LeadStatus.PROPOSAL)}
                  disabled={isOffline}
                >
                  Proposal Sent
                </Button>
                <Button
                  className={`w-full justify-start ${lead.status === LeadStatus.NEGOTIATION ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' : ''}`}
                  variant={
                    lead.status === LeadStatus.NEGOTIATION
                      ? 'secondary'
                      : 'outline'
                  }
                  onClick={() => handleStatusChange(LeadStatus.NEGOTIATION)}
                  disabled={isOffline}
                >
                  In Negotiation
                </Button>
                <Button
                  className={`w-full justify-start ${lead.status === LeadStatus.BOOKED ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}`}
                  variant={
                    lead.status === LeadStatus.BOOKED ? 'secondary' : 'outline'
                  }
                  onClick={() => handleStatusChange(LeadStatus.BOOKED)}
                  disabled={isOffline}
                >
                  Booked
                </Button>
                <Button
                  className={`w-full justify-start ${lead.status === LeadStatus.LOST ? 'bg-red-100 text-red-800 hover:bg-red-200' : ''}`}
                  variant={
                    lead.status === LeadStatus.LOST ? 'secondary' : 'outline'
                  }
                  onClick={() => handleStatusChange(LeadStatus.LOST)}
                  disabled={isOffline}
                >
                  Lost
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle>AI Insights</CardTitle>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => loadSuggestions()}
                disabled={isLoading}
                className='h-8 w-8 p-0'
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                />
                <span className='sr-only'>Refresh</span>
              </Button>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div>
                  <div className='text-sm font-medium'>Priority Score</div>
                  <div className='mt-1 flex items-center'>
                    <div className='w-full bg-gray-200 rounded-full h-2.5 mr-2'>
                      <div
                        className={`h-2.5 rounded-full ${
                          (lead.aiScore?.value || 0) > 70
                            ? 'bg-red-500'
                            : (lead.aiScore?.value || 0) > 40
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${lead.aiScore?.value || 0}%` }}
                      ></div>
                    </div>
                    <span className='text-xs font-medium'>
                      {Math.round(lead.aiScore?.value || 0)}
                    </span>
                  </div>
                </div>

                {suggestions?.priorityFactors && (
                  <div className='mt-2'>
                    <h4 className='text-xs font-medium text-muted-foreground'>
                      Score Factors:
                    </h4>
                    <div className='grid grid-cols-2 gap-1 mt-1'>
                      {Object.entries(suggestions.priorityFactors).map(
                        ([factor, value]) => (
                          <div
                            key={factor}
                            className='text-xs flex items-center'
                          >
                            <span
                              className={`w-1 h-1 rounded-full mr-1 ${Number(value) > 0.1 ? 'bg-red-500' : 'bg-yellow-500'}`}
                            ></span>
                            <span className='capitalize'>
                              {factor.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className='pt-3 border-t'>
                  <div className='text-sm font-medium mb-2'>
                    Suggested Next Action
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    {suggestions?.nextAction ||
                      ((lead.aiScore?.value || 0) > 70
                        ? 'This lead has high priority. Consider sending a personalized proposal soon.'
                        : (lead.aiScore?.value || 0) > 40
                          ? 'Follow up with additional information about their travel preferences.'
                          : 'Keep this lead informed with occasional updates about new travel options.')}
                  </p>
                </div>

                {suggestions?.replyTemplate && (
                  <div className='pt-3 border-t'>
                    <div className='text-sm font-medium mb-2'>
                      Suggested Reply Template
                    </div>
                    <div className='bg-gray-50 p-3 rounded text-sm'>
                      {suggestions.replyTemplate}
                    </div>
                  </div>
                )}

                {suggestions?.tags && suggestions.tags.length > 0 && (
                  <div className='pt-3 border-t'>
                    <div className='text-sm font-medium mb-2'>
                      Suggested Tags
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {suggestions.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant='outline'
                          className='bg-gray-50'
                          onClick={() => {
                            if (!lead.tags.includes(tag)) {
                              updateLead(lead._id || lead.id, {
                                tags: [...lead.tags, tag],
                              });
                            }
                          }}
                        >
                          + {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className='border-destructive/20'>
            <CardHeader>
              <CardTitle className='text-destructive'>Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant='destructive'
                className='w-full'
                onClick={handleDeleteLead}
              >
                <Trash2 className='mr-2 h-4 w-4' />
                Delete Lead
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailPage;
