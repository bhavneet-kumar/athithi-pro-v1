import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCrmStore } from '@/lib/store';
import { LeadStatus } from '@/types/crm';

interface ConversionFunnelChartProps {
  title: string;
  description?: string;
  height?: number | string;
}

const ConversionFunnelChart: React.FC<ConversionFunnelChartProps> = ({
  title,
  description,
  height = 350,
}) => {
  const { leads, isOffline } = useCrmStore();

  // Generate funnel data based on lead statuses
  const generateFunnelData = () => {
    // Count leads by status
    const statusCounts = Object.values(LeadStatus).reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<string, number>
    );

    leads.forEach(lead => {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    });

    // Define the order of statuses in the funnel
    const funnelOrder = [
      LeadStatus.NEW,
      LeadStatus.CONTACTED,
      LeadStatus.QUALIFIED,
      LeadStatus.PROPOSAL,
      LeadStatus.NEGOTIATION,
      LeadStatus.BOOKED,
    ];

    // Format data for the chart
    return funnelOrder.map(status => {
      // Format status label from "NEW" to "New"
      const formattedStatus =
        status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

      return {
        name: formattedStatus,
        value: statusCounts[status],
        fill: getFillColor(status),
      };
    });
  };

  const getFillColor = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.NEW:
        return '#9b87f5';
      case LeadStatus.CONTACTED:
        return '#8777e0';
      case LeadStatus.QUALIFIED:
        return '#7366cc';
      case LeadStatus.PROPOSAL:
        return '#6054b8';
      case LeadStatus.NEGOTIATION:
        return '#4e43a4';
      case LeadStatus.BOOKED:
        return '#3c3290';
      default:
        return '#9b87f5';
    }
  };

  const data = generateFunnelData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ height: height }}>
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
                layout='vertical'
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray='3 3'
                  horizontal={true}
                  vertical={false}
                />
                <XAxis type='number' />
                <YAxis
                  dataKey='name'
                  type='category'
                  tick={{ fontSize: 14 }}
                  width={100}
                />
                <Tooltip formatter={value => [`${value} leads`, 'Count']} />
                <Bar dataKey='value' minPointSize={5} isAnimationActive={false}>
                  <LabelList dataKey='value' position='right' />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionFunnelChart;
