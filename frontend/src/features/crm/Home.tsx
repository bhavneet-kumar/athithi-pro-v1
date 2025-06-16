import { format } from 'date-fns';
import {
  BadgeIndianRupee,
  Calendar,
  DollarSign,
  Flag,
  ListChecks,
  TrendingUp,
  Users,
} from 'lucide-react';
import React, { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useCurrency } from '@/hooks/useCurrency';
import { useCrmStore } from '@/lib/store';
import { LeadStatus, TaskPriority } from '@/types/crm';
import { useNavigate } from '@tanstack/react-router';

const Home: React.FC = () => {
  const { leads, tasks, bookings, communications } = useCrmStore();
  const navigate = useNavigate();
  const { formatCurrency, getCurrencyIconName } = useCurrency();

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const activeLeads = leads.filter(
      l => l.status !== LeadStatus.LOST && l.status !== LeadStatus.BOOKED
    ).length;
    const conversionRate =
      totalLeads > 0
        ? (leads.filter(l => l.status === LeadStatus.BOOKED).length /
            totalLeads) *
          100
        : 0;
    const pendingTasks = tasks.filter(
      t => !t.completed && new Date(t.dueDate) >= new Date()
    ).length;
    const overdueTasks = tasks.filter(
      t => !t.completed && new Date(t.dueDate) < new Date()
    ).length;
    const urgentTasks = tasks.filter(
      t => !t.completed && t.priority === TaskPriority.URGENT
    ).length;

    const totalRevenue = bookings.reduce(
      (sum, booking) => sum + booking.totalAmount,
      0
    );
    const expectedRevenue = leads
      .filter(
        l =>
          l.status === LeadStatus.NEGOTIATION ||
          l.status === LeadStatus.PROPOSAL
      )
      .reduce((sum, lead) => sum + (lead.budget || 0), 0);

    const recentActivity = [...communications]
      .sort(
        (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
      )
      .slice(0, 5);

    const highPriorityLeads = [...leads]
      .sort((a, b) => b.aiPriorityScore - a.aiPriorityScore)
      .slice(0, 5);

    // Fix the itinerary types issue - we need to check if startDate and endDate exist
    const upcomingTrips = bookings
      .filter(
        booking =>
          booking.status === 'confirmed' &&
          booking.itinerary?.startDate &&
          new Date(booking.itinerary.startDate as unknown as string) >
            new Date()
      )
      .sort((a, b) => {
        const aDate = a.itinerary?.startDate
          ? new Date(a.itinerary.startDate as unknown as string).getTime()
          : 0;
        const bDate = b.itinerary?.startDate
          ? new Date(b.itinerary.startDate as unknown as string).getTime()
          : 0;
        return aDate - bDate;
      })
      .slice(0, 3);

    return {
      totalLeads,
      activeLeads,
      conversionRate,
      pendingTasks,
      overdueTasks,
      urgentTasks,
      totalRevenue,
      expectedRevenue,
      recentActivity,
      highPriorityLeads,
      upcomingTrips,
    };
  }, [leads, tasks, communications, bookings]);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
          <p className='text-muted-foreground'>
            Welcome to AthitiPRO CRM. Here's an overview of your travel
            business.
          </p>
        </div>

        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => navigate({ to: '/crm/leads/new' })}
          >
            Add New Lead
          </Button>
          <Button onClick={() => navigate({ to: '/crm/tasks/new' })}>
            Create Task
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Leads</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{metrics.totalLeads}</div>
            <p className='text-xs text-muted-foreground mt-1'>
              {metrics.activeLeads} active leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Conversion Rate
            </CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {metrics.conversionRate.toFixed(1)}%
            </div>
            <Progress value={metrics.conversionRate} className='mt-2' />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Tasks</CardTitle>
            <ListChecks className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{metrics.pendingTasks}</div>
            <p className='text-xs text-muted-foreground mt-1'>
              {metrics.overdueTasks > 0 && (
                <span className='text-red-500 font-medium'>
                  {metrics.overdueTasks} overdue
                </span>
              )}
              {metrics.overdueTasks > 0 && metrics.urgentTasks > 0 && ' · '}
              {metrics.urgentTasks > 0 && (
                <span className='text-amber-500 font-medium'>
                  {metrics.urgentTasks} urgent
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Revenue</CardTitle>
            {getCurrencyIconName() === 'indian-rupee' ? (
              <BadgeIndianRupee className='h-4 w-4 text-muted-foreground' />
            ) : (
              <DollarSign className='h-4 w-4 text-muted-foreground' />
            )}
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(metrics.totalRevenue)}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {formatCurrency(metrics.expectedRevenue)} expected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout for High Priority and Recent Activity */}
      <div className='grid gap-4 md:grid-cols-2'>
        {/* High Priority Leads */}
        <Card className='col-span-1'>
          <CardHeader>
            <CardTitle>High Priority Leads</CardTitle>
            <CardDescription>
              Leads requiring your immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.highPriorityLeads.length > 0 ? (
              <div className='space-y-4'>
                {metrics.highPriorityLeads.map(lead => (
                  <div
                    key={lead.id}
                    className='flex items-center gap-4 border-b pb-4 last:border-0'
                  >
                    <div className='w-2 h-2 rounded-full bg-red-500 mt-1'></div>
                    <div className='flex-grow'>
                      <div className='font-medium'>{lead.name}</div>
                      <div className='text-sm text-muted-foreground flex items-center gap-1'>
                        <Flag className='h-3 w-3' />
                        <span>
                          Priority: {Math.round(lead.aiPriorityScore * 100)}%
                        </span>
                      </div>
                    </div>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => navigate({ to: `/crm/leads/${lead.id}` })}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-6 text-muted-foreground'>
                No high priority leads at the moment
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className='col-span-1'>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest communications with leads</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.recentActivity.length > 0 ? (
              <div className='space-y-4'>
                {metrics.recentActivity.map(activity => {
                  const relatedLead = leads.find(l => l.id === activity.leadId);
                  return (
                    <div
                      key={activity.id}
                      className='flex items-start gap-4 border-b pb-4 last:border-0'
                    >
                      <div className='mt-1'>
                        <Badge
                          variant={
                            activity.direction === 'incoming'
                              ? 'secondary'
                              : 'default'
                          }
                        >
                          {activity.direction === 'incoming' ? 'In' : 'Out'}
                        </Badge>
                      </div>
                      <div className='flex-grow'>
                        <div className='font-medium'>
                          {relatedLead?.name || 'Unknown Lead'}
                        </div>
                        <div className='text-sm line-clamp-1'>
                          {activity.content}
                        </div>
                        <div className='text-xs text-muted-foreground mt-1'>
                          {format(new Date(activity.sentAt), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className='text-center py-6 text-muted-foreground'>
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Trips */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Trips</CardTitle>
          <CardDescription>
            Travel itineraries that are booked and confirmed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.upcomingTrips.length > 0 ? (
            <div className='grid gap-4 md:grid-cols-3'>
              {metrics.upcomingTrips.map(trip => {
                const relatedLead = leads.find(l => l.id === trip.leadId);
                return (
                  <Card key={trip.id}>
                    <CardHeader className='pb-2'>
                      <div className='flex justify-between items-start'>
                        <CardTitle className='text-base'>
                          {trip.itinerary?.name || 'Trip'}
                        </CardTitle>
                        <Calendar className='h-4 w-4 text-muted-foreground' />
                      </div>
                      <CardDescription>
                        {relatedLead?.name || 'Unknown Client'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='pb-4'>
                      <div className='text-sm'>
                        <div className='flex justify-between items-center'>
                          <span>Departure:</span>
                          <span className='font-medium'>
                            {trip.itinerary?.startDate
                              ? format(
                                  new Date(
                                    trip.itinerary
                                      .startDate as unknown as string
                                  ),
                                  'MMM d, yyyy'
                                )
                              : 'TBD'}
                          </span>
                        </div>
                        <div className='flex justify-between items-center mt-1'>
                          <span>Return:</span>
                          <span className='font-medium'>
                            {trip.itinerary?.endDate
                              ? format(
                                  new Date(
                                    trip.itinerary.endDate as unknown as string
                                  ),
                                  'MMM d, yyyy'
                                )
                              : 'TBD'}
                          </span>
                        </div>
                        <div className='flex justify-between items-center mt-1'>
                          <span>Value:</span>
                          <span className='font-medium'>
                            {formatCurrency(trip.totalAmount)}
                          </span>
                        </div>
                        <div className='mt-3'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='w-full'
                            onClick={() =>
                              navigate({ to: `/crm/leads/${trip.leadId}` })
                            }
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className='text-center py-6 text-muted-foreground'>
              No upcoming trips scheduled
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
