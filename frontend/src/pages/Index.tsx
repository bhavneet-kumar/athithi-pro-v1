import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50'>
      <div className='container mx-auto px-4 py-16'>
        <div className='mb-16 text-center'>
          <h1 className='text-4xl font-bold tracking-tight text-crm-dark mb-2 md:text-5xl'>
            Travel Agent Nexus AI
          </h1>
          <p className='text-xl text-crm-dark/80 max-w-2xl mx-auto'>
            The intelligent CRM for travel agents that works with you, even when
            internet doesn't
          </p>
          <div className='mt-8 flex justify-center gap-4'>
            <Button
              size='lg'
              className='bg-crm-primary hover:bg-crm-secondary'
              onClick={() => navigate('/crm')}
            >
              Launch CRM
            </Button>
            <Button variant='outline' size='lg'>
              Learn More
            </Button>
          </div>
        </div>

        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader>
              <CardTitle>Lead Management</CardTitle>
              <CardDescription>
                Track potential clients from first contact to booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>
                Organize leads with our intuitive kanban or list view. AI
                automatically prioritizes your most promising prospects.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant='link' onClick={() => navigate('/crm/leads')}>
                View Leads
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Communication Hub</CardTitle>
              <CardDescription>
                Centralize all client interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>
                Track emails, calls, messages, and WhatsApp in one place. Smart
                templates and AI-suggested replies save you time.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant='link'
                onClick={() => navigate('/crm/communication')}
              >
                Open Hub
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Manager</CardTitle>
              <CardDescription>Never miss a follow-up again</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>
                Organize tasks by priority and due date. Automated reminders
                ensure timely follow-ups even on busy days.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant='link' onClick={() => navigate('/crm/tasks')}>
                Manage Tasks
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intelligent Insights</CardTitle>
              <CardDescription>Data-driven decisions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>
                AI-powered analytics identify trends and opportunities in your
                client base. Generate cohorts and custom reports.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant='link' onClick={() => navigate('/crm/insights')}>
                View Insights
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className='mt-16 text-center'>
          <h2 className='text-2xl font-bold mb-4'>Built for Travel Agents</h2>
          <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
            Designed specifically for travel agents, our CRM handles the unique
            needs of the travel industry with offline support and keyboard
            shortcuts for power users.
          </p>
          <Button
            className='mt-6 bg-crm-primary hover:bg-crm-secondary'
            onClick={() => navigate('/crm')}
          >
            Get Started
          </Button>
        </div>
      </div>

      <footer className='bg-gray-100 py-8 mt-16'>
        <div className='container mx-auto px-4 text-center text-sm text-muted-foreground'>
          <p>Travel Agent Nexus AI - Built with modern web technologies</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
