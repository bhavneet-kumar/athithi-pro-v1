import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCrmStore } from '@/lib/store';
import { LeadSource } from '@/types/crm';

interface LeadSourceChartProps {
  title: string;
  description?: string;
  height?: number | string;
}

const LeadSourceChart: React.FC<LeadSourceChartProps> = ({
  title,
  description,
  height = 350,
}) => {
  const { leads, isOffline } = useCrmStore();

  // Generate source distribution data
  const generateSourceData = () => {
    const sourceCounts = Object.values(LeadSource).reduce(
      (acc, source) => {
        acc[source] = 0;
        return acc;
      },
      {} as Record<string, number>
    );

    // Count leads by source
    leads.forEach(lead => {
      sourceCounts[lead.source] = (sourceCounts[lead.source] || 0) + 1;
    });

    // Convert to array format for PieChart
    return Object.entries(sourceCounts)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0); // Only include sources with leads
  };

  const data = generateSourceData();

  // Colors for the different sources
  const COLORS = [
    '#9b87f5',
    '#36B37E',
    '#FF5630',
    '#00B8D9',
    '#6554C0',
    '#FFAB00',
    '#7A869A',
    '#505F79',
  ];

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
          ) : data.length === 0 ? (
            <div className='h-full flex items-center justify-center'>
              <p className='text-muted-foreground'>
                No lead source data available
              </p>
            </div>
          ) : (
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={data}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  outerRadius={80}
                  fill='#8884d8'
                  dataKey='value'
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={value => [`${value} leads`, 'Count']} />
                <Legend
                  formatter={value =>
                    value.charAt(0).toUpperCase() + value.slice(1)
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadSourceChart;
