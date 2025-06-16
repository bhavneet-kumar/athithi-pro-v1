import {
  Download,
  BarChart2,
  PieChart,
  LineChart,
  TrendingUp,
  Users,
} from 'lucide-react';
import React from 'react';

import AgentPerformanceChart from '@/components/crm/charts/AgentPerformanceChart';
import ConversionFunnelChart from '@/components/crm/charts/ConversionFunnelChart';
import LeadSourceChart from '@/components/crm/charts/LeadSourceChart';
import PerformanceChart from '@/components/crm/charts/PerformanceChart';
import ResponseTimeChart from '@/components/crm/charts/ResponseTimeChart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateCohorts } from '@/lib/ai/generateCohorts';
import { useCrmStore } from '@/lib/store';

const InsightsPage: React.FC = () => {
  const { leads, communications, tasks, bookings, isOffline } = useCrmStore();

  // Generate cohorts from leads data using our AI utility
  const cohorts = React.useMemo(() => generateCohorts(leads), [leads]);

  const conversionRate =
    leads.length > 0 ? Math.round((bookings.length / leads.length) * 100) : 0;

  // Calculate average response time (placeholder implementation)
  const averageResponseTime = '3.5 hours';

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Insights & Analytics
          </h1>
          <p className='text-muted-foreground'>
            Data-driven insights to improve your business
          </p>
        </div>

        <Button variant='outline' disabled={isOffline}>
          <Download className='mr-2 h-4 w-4' />
          Export Report
        </Button>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Conversion Rate
            </CardTitle>
            <CardDescription>Leads to bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{conversionRate}%</div>
            <p className='text-xs text-muted-foreground mt-1'>
              {conversionRate > 20
                ? 'Good performance'
                : 'Room for improvement'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Response Time</CardTitle>
            <CardDescription>Average first response</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{averageResponseTime}</div>
            <p className='text-xs text-muted-foreground mt-1'>
              Industry avg: 5.2 hours
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Lead Value</CardTitle>
            <CardDescription>Average booking value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              $
              {bookings.length > 0
                ? Math.round(
                    bookings.reduce((sum, b) => sum + b.totalAmount, 0) /
                      bookings.length
                  )
                : 0}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Per converted lead
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='performance' className='w-full'>
        <TabsList>
          <TabsTrigger value='performance'>Performance</TabsTrigger>
          <TabsTrigger value='funnel'>Conversion Funnel</TabsTrigger>
          <TabsTrigger value='sources'>Lead Sources</TabsTrigger>
          <TabsTrigger value='cohorts'>AI Cohorts</TabsTrigger>
        </TabsList>

        <TabsContent value='performance' className='space-y-4 mt-6'>
          <PerformanceChart
            title='Performance Overview'
            description='Key metrics over the last 6 months'
          />

          <div className='grid gap-4 md:grid-cols-2'>
            <ResponseTimeChart
              title='Response Times'
              description='Average response time by communication channel'
            />

            <AgentPerformanceChart
              title='Agent Performance'
              description='Conversion rates by team member'
            />
          </div>
        </TabsContent>

        <TabsContent value='funnel' className='mt-6'>
          <ConversionFunnelChart
            title='Conversion Funnel'
            description='Lead journey from first contact to booking'
          />
        </TabsContent>

        <TabsContent value='sources' className='mt-6'>
          <LeadSourceChart
            title='Lead Source Analysis'
            description='Performance metrics by acquisition channel'
          />
        </TabsContent>

        <TabsContent value='cohorts' className='mt-6 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Client Cohorts</CardTitle>
              <CardDescription>
                Automatically identified groups of similar leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cohorts.length > 0 ? (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  {cohorts.map(cohort => (
                    <Card key={cohort.id} className='border border-dashed'>
                      <CardHeader className='pb-2'>
                        <CardTitle className='text-base font-medium'>
                          {cohort.name}
                        </CardTitle>
                        <CardDescription className='text-xs'>
                          {cohort.leadIds.length} leads
                        </CardDescription>
                      </CardHeader>
                      <CardContent className='pt-0'>
                        <p className='text-sm mb-2'>{cohort.description}</p>
                        <div className='flex flex-wrap gap-1'>
                          {cohort.tags.map(tag => (
                            <Badge
                              key={tag}
                              variant='outline'
                              className='text-xs'
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className='text-center py-12'>
                  <p className='text-muted-foreground'>
                    Not enough lead data to generate cohorts
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>
                Smart suggestions for improving conversions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className='space-y-3'>
                <li className='flex gap-3 items-start p-3 border rounded-lg'>
                  <div className='bg-blue-100 rounded-full p-2 text-blue-700'>
                    <TrendingUp className='h-4 w-4' />
                  </div>
                  <div>
                    <p className='font-medium'>
                      Follow up with honeymoon leads
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      Honeymoon leads convert 2.5x better when contacted within
                      2 hours
                    </p>
                  </div>
                </li>
                <li className='flex gap-3 items-start p-3 border rounded-lg'>
                  <div className='bg-blue-100 rounded-full p-2 text-blue-700'>
                    <Users className='h-4 w-4' />
                  </div>
                  <div>
                    <p className='font-medium'>Family travel micro-campaign</p>
                    <p className='text-sm text-muted-foreground'>
                      5 leads are planning family trips to similar destinations
                      in August
                    </p>
                  </div>
                </li>
                <li className='flex gap-3 items-start p-3 border rounded-lg'>
                  <div className='bg-blue-100 rounded-full p-2 text-blue-700'>
                    <BarChart2 className='h-4 w-4' />
                  </div>
                  <div>
                    <p className='font-medium'>
                      Improve WhatsApp response time
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      WhatsApp leads have 30% higher conversion but 45% slower
                      response time
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InsightsPage;
