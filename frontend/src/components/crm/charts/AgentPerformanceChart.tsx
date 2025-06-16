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

interface AgentPerformanceChartProps {
  title: string;
  description?: string;
  height?: number | string;
}

const AgentPerformanceChart: React.FC<AgentPerformanceChartProps> = ({
  title,
  description,
}) => {
  const { leads, bookings, isOffline } = useCrmStore();

  // Generate sample agent performance data
  // In a real application, this would use actual agent data
  const generateAgentData = () => {
    // Sample agent IDs and names
    const agents = [
      { id: 'agent-1', name: 'Sarah' },
      { id: 'agent-2', name: 'Michael' },
      { id: 'agent-3', name: 'Emma' },
    ];

    return agents.map(agent => {
      // Count leads assigned to this agent
      const agentLeads = leads.filter(lead => lead.assignedTo === agent.id);

      // Count bookings from those leads
      const agentBookings = bookings.filter(booking => {
        const lead = leads.find(l => l.id === booking.leadId);
        return lead && lead.assignedTo === agent.id;
      });

      // Calculate conversion rate
      const conversionRate =
        agentLeads.length > 0
          ? Math.round((agentBookings.length / agentLeads.length) * 100)
          : 0;

      return {
        name: agent.name,
        leads: agentLeads.length,
        bookings: agentBookings.length,
        conversionRate,
      };
    });
  };

  const data = generateAgentData();

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
              <BarChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                layout='vertical'
              >
                <CartesianGrid
                  strokeDasharray='3 3'
                  horizontal={true}
                  vertical={false}
                />
                <XAxis type='number' />
                <YAxis type='category' dataKey='name' width={100} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'conversionRate') {
                      return [`${value}%`, 'Conversion Rate'];
                    }
                    return [value, name === 'leads' ? 'Leads' : 'Bookings'];
                  }}
                />
                <Legend />
                <Bar dataKey='leads' fill='#9b87f5' name='Leads' />
                <Bar dataKey='bookings' fill='#36B37E' name='Bookings' />
                <Bar
                  dataKey='conversionRate'
                  fill='#FF5630'
                  name='Conversion Rate %'
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentPerformanceChart;
