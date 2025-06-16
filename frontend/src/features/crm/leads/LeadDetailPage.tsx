import { format, isValid, parseISO } from 'date-fns';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Tag,
  DollarSign,
  Edit,
  Trash2,
  MessageSquare,
  ClipboardList,
  FileCheck,
  ArrowLeft,
  Clock,
  RefreshCw,
  BarChart2,
  BadgeIndianRupee,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrency } from '@/hooks/useCurrency';
import { useLeadSuggestions } from '@/hooks/useLeadSuggestions';
import { getLeadSuggestions } from '@/lib/ai/getLeadSuggestions';
import { useCrmStore } from '@/lib/store';

import { LeadStatus, LeadSuggestion } from '@/types/crm';
import { toast } from '@/hooks/use-toast';

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
  const { id } = useParams<{ id: string }>();
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

  const lead = leads.find(l => l.id === id);

  // Use the hook to get suggestions instead of local state
  const { suggestions, isLoading, error, loadSuggestions } =
    useLeadSuggestions(id);

  // Currency formatting helper
  const { formatCurrency, getCurrencyIconName } = useCurrency();

  const formattedBudget = lead?.budget
    ? formatCurrency(lead.budget)
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

  if (!lead) {
    return (
      <div className='flex flex-col items-center justify-center h-[70vh]'>
        <h2 className='text-2xl font-bold'>Lead Not Found</h2>
        <p className='text-muted-foreground mt-2'>
          The lead you're looking for doesn't exist.
        </p>
        <Button className='mt-4' onClick={() => navigate('/crm/leads')}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Leads
        </Button>
      </div>
    );
  }

  // Find related data
  const leadCommunications = communications.filter(c => c.leadId === lead.id);
  const leadTasks = tasks.filter(t => t.leadId === lead.id);
  const leadBookings = bookings.filter(b => b.leadId === lead.id);

  const handleStatusChange = (status: LeadStatus) => {
    if (isOffline) {
      toast({
        title: 'Offline Mode',
        description: "Status changes will be synced when you're back online.",
        variant: 'default',
      });
    }

    updateLead(lead.id, { status });
    setCurrentStatus(status);
  };

  const handleDeleteLead = () => {
    if (isOffline) {
      toast({
        title: 'Offline Mode',
        description: "This lead will be deleted when you're back online.",
        variant: 'default',
      });
    }

    deleteLead(lead.id);
    navigate('/crm/leads');
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
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div className='flex items-center'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => navigate('/crm/leads')}
            className='mr-2'
          >
            <ArrowLeft className='h-4 w-4 mr-1' />
            Back
          </Button>
          <h1 className='text-2xl font-bold tracking-tight'>{lead.name}</h1>
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
            onClick={() => navigate(`/crm/communication/new/${lead.id}`)}
            disabled={isOffline}
          >
            <MessageSquare className='mr-2 h-4 w-4' />
            Message
          </Button>
          <Button
            variant='outline'
            onClick={() => navigate(`/crm/tasks/new/${lead.id}`)}
            disabled={isOffline}
          >
            <ClipboardList className='mr-2 h-4 w-4' />
            Add Task
          </Button>
          <Button
            variant='outline'
            onClick={() => navigate(`/crm/bookings/new/${lead.id}`)}
            disabled={isOffline}
          >
            <FileCheck className='mr-2 h-4 w-4' />
            Create Booking
          </Button>
          <Button
            onClick={() => navigate(`/crm/leads/${lead.id}/edit`)}
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
                  {lead.budget && (
                    <div className='flex items-center'>
                      {getCurrencyIconName() === 'indian-rupee' ? (
                        <BadgeIndianRupee className='h-4 w-4 text-muted-foreground mr-2' />
                      ) : (
                        <DollarSign className='h-4 w-4 text-muted-foreground mr-2' />
                      )}
                      <span className='text-sm'>Budget: {formattedBudget}</span>
                    </div>
                  )}
                  {lead.travelDates?.start && (
                    <div className='flex items-center'>
                      <Calendar className='h-4 w-4 text-muted-foreground mr-2' />
                      <span className='text-sm'>
                        Travel Dates:{' '}
                        {safeFormat(lead.travelDates.start, 'MMM d, yyyy')}
                        {lead.travelDates.end &&
                          ` - ${safeFormat(lead.travelDates.end, 'MMM d, yyyy')}`}
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

              {lead.preferences && Object.keys(lead.preferences).length > 0 && (
                <div className='mt-4 pt-4 border-t'>
                  <h4 className='text-sm font-medium mb-2'>Preferences</h4>
                  <dl className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                    {Object.entries(lead.preferences).map(([key, value]) => (
                      <div key={key}>
                        <dt className='text-xs text-muted-foreground capitalize'>
                          {key}
                        </dt>
                        <dd className='text-sm'>{value}</dd>
                      </div>
                    ))}
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
                          lead.aiPriorityScore > 0.7
                            ? 'bg-red-500'
                            : lead.aiPriorityScore > 0.4
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${lead.aiPriorityScore * 100}%` }}
                      ></div>
                    </div>
                    <span className='text-xs font-medium'>
                      {Math.round(lead.aiPriorityScore * 100)}
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
                              className={`w-1 h-1 rounded-full mr-1 ${value > 0.1 ? 'bg-red-500' : 'bg-yellow-500'}`}
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
                      (lead.aiPriorityScore > 0.7
                        ? 'This lead has high priority. Consider sending a personalized proposal soon.'
                        : lead.aiPriorityScore > 0.4
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
                              updateLead(lead.id, {
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
