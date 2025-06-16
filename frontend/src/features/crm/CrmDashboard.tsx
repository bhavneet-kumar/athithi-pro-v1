import { format } from 'date-fns';
import {
  User,
  Phone,
  MessageSquare,
  Calendar,
  FileCheck,
  BarChart2,
  ArrowRight,
  Clock,
  Users,
} from 'lucide-react';
import React from 'react';

import Layout from '@/components/crm/Layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCrmStore } from '@/lib/store';
import { useNavigate } from '@tanstack/react-router';

const CrmDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { leads, tasks, communications, bookings } = useCrmStore();

  const uncompletedTasks = tasks.filter(task => !task.completed);
  const todayTasks = uncompletedTasks.filter(
    task => new Date(task.dueDate).toDateString() === new Date().toDateString()
  );
  const overdueTasks = uncompletedTasks.filter(
    task =>
      new Date(task.dueDate) < new Date() &&
      new Date(task.dueDate).toDateString() !== new Date().toDateString()
  );

  // Lead stats
  const newLeads = leads.filter(lead => lead.status === 'new');
  const qualifiedLeads = leads.filter(lead => lead.status === 'qualified');

  // Booking stats
  const totalBookingValue = bookings.reduce(
    (sum, booking) => sum + booking.totalAmount,
    0
  );
  const paidValue = bookings.reduce(
    (sum, booking) => sum + booking.paidAmount,
    0
  );

  return (
    <Layout>
      <div className='space-y-6'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
          <p className='text-muted-foreground'>
            Overview of your travel agency CRM
          </p>
        </div>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Leads</CardTitle>
              <User className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{leads.length}</div>
              <p className='text-xs text-muted-foreground'>
                {newLeads.length} new, {qualifiedLeads.length} qualified
              </p>
              <Button
                variant='link'
                className='px-0 text-xs'
                onClick={() => navigate({ to: '/crm/leads' })}
              >
                View all leads
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Tasks</CardTitle>
              <Calendar className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {uncompletedTasks.length}
              </div>
              <p className='text-xs text-muted-foreground'>
                {todayTasks.length} due today, {overdueTasks.length} overdue
              </p>
              <Button
                variant='link'
                className='px-0 text-xs'
                onClick={() => navigate({ to: '/crm/tasks' })}
              >
                View all tasks
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Bookings</CardTitle>
              <FileCheck className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{bookings.length}</div>
              <p className='text-xs text-muted-foreground'>
                ${totalBookingValue.toLocaleString()} total value
              </p>
              <Button
                variant='link'
                className='px-0 text-xs'
                onClick={() => navigate({ to: '/crm/bookings' })}
              >
                View all bookings
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Revenue</CardTitle>
              <BarChart2 className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                ${paidValue.toLocaleString()}
              </div>
              <p className='text-xs text-muted-foreground'>
                <span className='text-green-600'>
                  {Math.round((paidValue / totalBookingValue) * 100)}%
                </span>{' '}
                of total booked value
              </p>
              <Button
                variant='link'
                className='px-0 text-xs'
                onClick={() => navigate({ to: '/crm/insights' })}
              >
                View insights
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue='quick-actions' className='w-full'>
          <TabsList>
            <TabsTrigger value='quick-actions'>Quick Actions</TabsTrigger>
            <TabsTrigger value='activity'>Recent Activity</TabsTrigger>
            <TabsTrigger value='priorities'>Priorities</TabsTrigger>
          </TabsList>
          <TabsContent value='quick-actions' className='mt-6 space-y-4'>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              <Card
                className='cursor-pointer hover:bg-gray-50 transition-colors'
                onClick={() => navigate({ to: '/crm/leads/new' })}
              >
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <User className='mr-2 h-5 w-5' />
                    Add New Lead
                  </CardTitle>
                  <CardDescription>
                    Create a new client lead record
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className='cursor-pointer hover:bg-gray-50 transition-colors'>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <Phone className='mr-2 h-5 w-5' />
                    Log Call
                  </CardTitle>
                  <CardDescription>
                    Record a phone conversation with a client
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className='cursor-pointer hover:bg-gray-50 transition-colors'>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <MessageSquare className='mr-2 h-5 w-5' />
                    Send Message
                  </CardTitle>
                  <CardDescription>
                    Communicate with a client via email or WhatsApp
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card
                className='cursor-pointer hover:bg-gray-50 transition-colors'
                onClick={() => navigate({ to: '/crm/tasks' })}
              >
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <Calendar className='mr-2 h-5 w-5' />
                    Create Task
                  </CardTitle>
                  <CardDescription>
                    Schedule a new task or follow-up
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card
                className='cursor-pointer hover:bg-gray-50 transition-colors'
                onClick={() => navigate({ to: '/crm/bookings' })}
              >
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <FileCheck className='mr-2 h-5 w-5' />
                    Record Booking
                  </CardTitle>
                  <CardDescription>
                    Register a new confirmed booking
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card
                className='cursor-pointer hover:bg-gray-50 transition-colors'
                onClick={() => navigate({ to: '/crm/insights' })}
              >
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <BarChart2 className='mr-2 h-5 w-5' />
                    View Reports
                  </CardTitle>
                  <CardDescription>
                    Access insights and analytics
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value='activity' className='mt-6 space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  The latest updates across your CRM
                </CardDescription>
              </CardHeader>
              <CardContent className='p-0'>
                <div className='border-t'>
                  {communications.length > 0 ? (
                    <div className='divide-y'>
                      {communications.slice(0, 5).map(comm => (
                        <div key={comm.id} className='flex items-start p-4'>
                          <div
                            className={`rounded-full p-2 mr-3 ${
                              comm.direction === 'incoming'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            <MessageSquare className='h-4 w-4' />
                          </div>
                          <div className='flex-1'>
                            <p className='text-sm'>
                              <span className='font-medium'>
                                {comm.direction === 'incoming'
                                  ? 'Received message from'
                                  : 'Sent message to'}
                              </span>{' '}
                              <span className='font-semibold'>
                                {leads.find(l => l.id === comm.leadId)?.name}
                              </span>
                            </p>
                            <p className='text-xs text-muted-foreground mt-1'>
                              {format(
                                new Date(comm.sentAt),
                                "MMM d, yyyy 'at' h:mm a"
                              )}
                            </p>
                          </div>
                          <Button size='sm' variant='outline'>
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='p-6 text-center'>
                      <p className='text-muted-foreground'>
                        No recent activity found
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='priorities' className='mt-6 space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <Clock className='mr-2 h-5 w-5 text-red-500' />
                    Overdue Tasks
                  </CardTitle>
                  <CardDescription>
                    Tasks that require immediate attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {overdueTasks.length > 0 ? (
                    <div className='space-y-4'>
                      {overdueTasks.slice(0, 3).map(task => (
                        <div
                          key={task.id}
                          className='flex justify-between items-center'
                        >
                          <div>
                            <p className='font-medium text-sm'>{task.title}</p>
                            <p className='text-xs text-red-500'>
                              Due{' '}
                              {format(new Date(task.dueDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Button
                            size='sm'
                            onClick={() => navigate({ to: '/crm/tasks' })}
                          >
                            <ArrowRight className='h-4 w-4' />
                            <span className='sr-only'>View task</span>
                          </Button>
                        </div>
                      ))}
                      {overdueTasks.length > 3 && (
                        <Button
                          variant='outline'
                          className='w-full mt-2'
                          onClick={() => navigate({ to: '/crm/tasks' })}
                        >
                          View all {overdueTasks.length} overdue tasks
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className='py-8 text-center'>
                      <p className='text-muted-foreground'>No overdue tasks</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <Users className='mr-2 h-5 w-5 text-blue-500' />
                    High Priority Leads
                  </CardTitle>
                  <CardDescription>
                    Leads with the highest conversion potential
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {leads.length > 0 ? (
                    <div className='space-y-4'>
                      {leads
                        .sort((a, b) => b.aiPriorityScore - a.aiPriorityScore)
                        .slice(0, 3)
                        .map(lead => (
                          <div key={lead.id} className='space-y-2'>
                            <div className='flex justify-between items-center'>
                              <p className='font-medium text-sm'>{lead.name}</p>
                              <Button
                                size='sm'
                                onClick={() =>
                                  navigate({ to: `/crm/leads/${lead.id}` })
                                }
                              >
                                <ArrowRight className='h-4 w-4' />
                                <span className='sr-only'>View lead</span>
                              </Button>
                            </div>
                            <div className='space-y-1'>
                              <div className='flex justify-between text-xs'>
                                <span>Priority Score</span>
                                <span>
                                  {Math.round(lead.aiPriorityScore * 100)}
                                </span>
                              </div>
                              <Progress
                                value={lead.aiPriorityScore * 100}
                                className='h-1.5'
                              />
                            </div>
                          </div>
                        ))}
                      <Button
                        variant='outline'
                        className='w-full mt-2'
                        onClick={() => navigate({ to: '/crm/leads' })}
                      >
                        View all leads
                      </Button>
                    </div>
                  ) : (
                    <div className='py-8 text-center'>
                      <p className='text-muted-foreground'>No leads found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CrmDashboard;
