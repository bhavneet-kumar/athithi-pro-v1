import { MessageSquare, User, Phone, Mail } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCrmStore } from '@/lib/store';

const CommunicationPage: React.FC = () => {
  const { communications, leads } = useCrmStore();

  // Get a mapping of lead IDs to names for display
  const leadMap = leads.reduce(
    (acc, lead) => {
      acc[lead.id] = lead.name;
      return acc;
    },
    {} as Record<string, string>
  );

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Communication Hub
          </h1>
          <p className='text-muted-foreground'>
            Manage all your client communications in one place
          </p>
        </div>

        <div className='flex gap-2'>
          <Button>
            <MessageSquare className='mr-2 h-4 w-4' />
            New Message
          </Button>
          <Button variant='outline'>
            <Phone className='mr-2 h-4 w-4' />
            Log Call
          </Button>
        </div>
      </div>

      <Tabs defaultValue='all' className='w-full'>
        <TabsList>
          <TabsTrigger value='all'>All</TabsTrigger>
          <TabsTrigger value='email'>Email</TabsTrigger>
          <TabsTrigger value='whatsapp'>WhatsApp</TabsTrigger>
          <TabsTrigger value='calls'>Calls</TabsTrigger>
          <TabsTrigger value='sms'>SMS</TabsTrigger>
        </TabsList>
        <TabsContent value='all' className='mt-6 space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6'>
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm font-medium'>
                  Recent Messages
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-1 text-sm'>
                <p className='text-xs text-muted-foreground'>Last 30 days</p>
                <div className='text-2xl font-bold'>
                  {communications.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm font-medium'>
                  Response Rate
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-1 text-sm'>
                <p className='text-xs text-muted-foreground'>Average time</p>
                <div className='text-2xl font-bold'>3.2 hrs</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm font-medium'>
                  Open Threads
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-1 text-sm'>
                <p className='text-xs text-muted-foreground'>
                  Awaiting response
                </p>
                <div className='text-2xl font-bold'>12</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm font-medium'>
                  Sentiment Score
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-1 text-sm'>
                <p className='text-xs text-muted-foreground'>
                  Average sentiment
                </p>
                <div className='text-2xl font-bold'>
                  0.76 <span className='text-xs text-green-600'>Positive</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2 className='text-xl font-semibold mt-6 mb-4'>
            Recent Communications
          </h2>

          {communications.length > 0 ? (
            <div className='space-y-4'>
              {communications.map(comm => (
                <Card key={comm.id} className='overflow-hidden'>
                  <div className='flex border-l-4 border-crm-primary'>
                    <div className='p-4 flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <User className='h-5 w-5 text-muted-foreground' />
                        <span className='font-medium'>
                          {leadMap[comm.leadId] || 'Unknown Lead'}
                        </span>
                        <span className='text-muted-foreground text-sm'>
                          via {comm.channel}
                        </span>
                      </div>
                      <p className='text-sm line-clamp-2'>{comm.content}</p>
                      <div className='mt-2 flex items-center text-xs text-muted-foreground'>
                        <span>{new Date(comm.sentAt).toLocaleString()}</span>
                        <span className='mx-2'>•</span>
                        <span>
                          {comm.direction === 'incoming'
                            ? 'From Client'
                            : 'From Agent'}
                        </span>
                      </div>
                    </div>
                    <div className='border-l flex items-center p-4 bg-gray-50'>
                      <Button variant='ghost' size='sm'>
                        Reply
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className='p-8 text-center'>
              <div className='mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4'>
                <MessageSquare className='h-6 w-6 text-muted-foreground' />
              </div>
              <h3 className='text-lg font-medium'>No communications yet</h3>
              <p className='text-muted-foreground mt-2 mb-4'>
                Start a conversation with a lead to begin tracking
                communications
              </p>
              <div className='flex justify-center gap-2'>
                <Button>
                  <Mail className='mr-2 h-4 w-4' />
                  Send Email
                </Button>
                <Button variant='outline'>
                  <Phone className='mr-2 h-4 w-4' />
                  Log Call
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>
        <TabsContent value='email'>
          <div className='p-8 text-center text-muted-foreground'>
            Email communications will be displayed here
          </div>
        </TabsContent>
        <TabsContent value='whatsapp'>
          <div className='p-8 text-center text-muted-foreground'>
            WhatsApp communications will be displayed here
          </div>
        </TabsContent>
        <TabsContent value='calls'>
          <div className='p-8 text-center text-muted-foreground'>
            Call logs will be displayed here
          </div>
        </TabsContent>
        <TabsContent value='sms'>
          <div className='p-8 text-center text-muted-foreground'>
            SMS communications will be displayed here
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunicationPage;
