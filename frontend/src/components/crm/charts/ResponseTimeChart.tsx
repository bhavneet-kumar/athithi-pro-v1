import React from 'react';
import {
  LineChart,
  Line,
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
import { CommunicationChannel } from '@/types/crm';

interface ResponseTimeChartProps {
  title: string;
  description?: string;
  height?: number | string;
}

const ResponseTimeChart: React.FC<ResponseTimeChartProps> = ({
  title,
  description,
  height = 250,
}) => {
  const { communications, isOffline } = useCrmStore();

  // Generate sample response time data by channel
  // In a real application, this would calculate actual response times
  const generateResponseTimeData = () => {
    const channelTypes = Object.values(CommunicationChannel);
    const data = [];

    // Generate data for days of the week
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    days.forEach(day => {
      const dayData: Record<string, any> = { name: day };

      // For each channel, calculate a "response time"
      // This is just sample data - in a real app you would calculate this from actual communications
      channelTypes.forEach(channel => {
        // Simple hash function to generate consistent pseudo-random values
        const hash = (str: string): number => {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash = hash & hash;
          }
          return Math.abs(hash);
        };

        // Generate a "response time" between 0.5 and 5 hours
        const seed = hash(`${day}-${channel}`);
        dayData[channel] = ((seed % 45) + 5) / 10;
      });

      data.push(dayData);
    });

    return data;
  };

  const data = generateResponseTimeData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className='h-[250px]'>
          {isOffline ? (
            <div className='h-full flex items-center justify-center'>
              <p className='text-muted-foreground'>
                Charts are unavailable while offline
              </p>
            </div>
          ) : (
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' vertical={false} />
                <XAxis dataKey='name' />
                <YAxis tickFormatter={value => `${value}h`} />
                <Tooltip
                  formatter={value => [`${value} hours`, 'Response Time']}
                />
                <Legend />
                <Line
                  type='monotone'
                  dataKey='email'
                  stroke='#8884d8'
                  activeDot={{ r: 8 }}
                  name='Email'
                />
                <Line
                  type='monotone'
                  dataKey='whatsapp'
                  stroke='#25D366'
                  activeDot={{ r: 8 }}
                  name='WhatsApp'
                />
                <Line
                  type='monotone'
                  dataKey='phone'
                  stroke='#FF5630'
                  activeDot={{ r: 8 }}
                  name='Phone'
                />
                <Line
                  type='monotone'
                  dataKey='sms'
                  stroke='#36B37E'
                  activeDot={{ r: 8 }}
                  name='SMS'
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResponseTimeChart;
