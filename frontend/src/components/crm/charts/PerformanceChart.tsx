import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCrmStore } from '@/lib/store';

interface PerformanceChartProps {
  title: string;
  description?: string;
  height?: number | string;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  title,
  description,
}) => {
  const { leads, bookings, isOffline } = useCrmStore();

  // Generate data for the last 6 months
  const generateMonthlyData = () => {
    const data = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });

      // Filter leads created in this month
      const leadsInMonth = leads.filter(lead => {
        const leadDate =
          lead.createdAt instanceof Date
            ? lead.createdAt
            : new Date(lead.createdAt);

        return (
          leadDate.getMonth() === month.getMonth() &&
          leadDate.getFullYear() === month.getFullYear()
        );
      });

      // Filter bookings created in this month
      const bookingsInMonth = bookings.filter(booking => {
        const bookingDate =
          booking.createdAt instanceof Date
            ? booking.createdAt
            : new Date(booking.createdAt);

        return (
          bookingDate.getMonth() === month.getMonth() &&
          bookingDate.getFullYear() === month.getFullYear()
        );
      });

      data.push({
        name: monthName,
        leads: leadsInMonth.length,
        bookings: bookingsInMonth.length,
        conversionRate: leadsInMonth.length
          ? Math.round((bookingsInMonth.length / leadsInMonth.length) * 100)
          : 0,
      });
    }

    return data;
  };

  const data = generateMonthlyData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className='h-[300px]'>
          {isOffline ? (
            <div className='h-full flex items-center justify-center'>
              <p className='text-muted-foreground'>
                Charts are unavailable while offline
              </p>
            </div>
          ) : (
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' vertical={false} />
                <XAxis dataKey='name' />
                <YAxis yAxisId='left' orientation='left' />
                <YAxis
                  yAxisId='right'
                  orientation='right'
                  domain={[0, 100]}
                  tickFormatter={value => `${value}%`}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'conversionRate') {
                      return [`${value}%`, 'Conversion Rate'];
                    }
                    return [value, name === 'leads' ? 'Leads' : 'Bookings'];
                  }}
                />
                <Legend />
                <Bar
                  yAxisId='left'
                  dataKey='leads'
                  fill='#9b87f5'
                  name='Leads'
                />
                <Bar
                  yAxisId='left'
                  dataKey='bookings'
                  fill='#36B37E'
                  name='Bookings'
                />
                <Bar
                  yAxisId='right'
                  dataKey='conversionRate'
                  fill='#FF5630'
                  name='Conversion Rate'
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;
