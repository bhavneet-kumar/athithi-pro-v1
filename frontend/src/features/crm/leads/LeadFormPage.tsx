import { zodResolver } from '@hookform/resolvers/zod';
import { isValid } from 'date-fns';
import { ArrowLeft, Save, X } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';

import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCrmStore } from '@/lib/store';

import { LeadSource, LeadStatus } from '@/types/crm';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useNavigate, useParams } from '@tanstack/react-router';

// Helper function to safely format a date to YYYY-MM-DD
const formatSafeDate = (date: Date | string | undefined): string => {
  if (!date) {
    return '';
  }

  let dateObj: Date;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  // Check if the date is valid before formatting
  if (!isValid(dateObj)) {
    return '';
  }

  try {
    // Format to YYYY-MM-DD
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

// Simplified form schema derived from LeadSchema
const leadFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  status: z.nativeEnum(LeadStatus),
  source: z.nativeEnum(LeadSource),
  notes: z.string().optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')), // Will be split by comma
  budget: z.string().optional().or(z.literal('')), // Will be parsed to number
  destination: z.string().optional().or(z.literal('')),
  accommodation: z.string().optional().or(z.literal('')),
  activities: z.string().optional().or(z.literal('')),
  travelStartDate: z.string().optional().or(z.literal('')),
  travelEndDate: z.string().optional().or(z.literal('')),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

const LeadFormPage: React.FC = () => {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();
  const { leads, addLead, updateLead, isOffline } = useCrmStore();
  const isEditMode = Boolean(id);

  // Find lead if in edit mode
  const lead = isEditMode ? leads.find(l => l.id === id) : null;

  // Initialize form with safely formatted dates
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: lead?.name || '',
      email: lead?.email || '',
      phone: lead?.phone || '',
      status: lead?.status || LeadStatus.NEW,
      source: lead?.source || LeadSource.WEBSITE,
      notes: lead?.notes || '',
      tags: lead?.tags.join(', ') || '',
      budget: lead?.budget ? String(lead.budget) : '',
      destination: lead?.preferences?.destination || '',
      accommodation: lead?.preferences?.accommodation || '',
      activities: lead?.preferences?.activities || '',
      travelStartDate: lead?.travelDates?.start
        ? formatSafeDate(lead.travelDates.start)
        : '',
      travelEndDate: lead?.travelDates?.end
        ? formatSafeDate(lead.travelDates.end)
        : '',
    },
  });

  // Handle form submission
  const onSubmit = (data: LeadFormValues) => {
    if (isOffline) {
      toast({
        title: 'Offline Mode',
        description: isEditMode
          ? "Lead updates will be synced when you're back online."
          : "New lead will be created when you're back online.",
        variant: 'default',
      });
    }

    try {
      // Parse form data
      const parsedData = {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        status: data.status,
        source: data.source,
        notes: data.notes || undefined,
        tags: data.tags
          ? data.tags
              .split(',')
              .map(tag => tag.trim())
              .filter(Boolean)
          : [],
        budget: data.budget ? Number(data.budget) : undefined,
        travelDates: {
          // Only create Date objects for non-empty strings
          start: data.travelStartDate
            ? new Date(data.travelStartDate)
            : undefined,
          end: data.travelEndDate ? new Date(data.travelEndDate) : undefined,
        },
        preferences: {
          ...(data.destination ? { destination: data.destination } : {}),
          ...(data.accommodation ? { accommodation: data.accommodation } : {}),
          ...(data.activities ? { activities: data.activities } : {}),
        },
      };

      // Validate dates before saving
      if (
        parsedData.travelDates.start &&
        !isValid(parsedData.travelDates.start)
      ) {
        throw new Error('Invalid start date');
      }

      if (parsedData.travelDates.end && !isValid(parsedData.travelDates.end)) {
        throw new Error('Invalid end date');
      }

      if (isEditMode && lead) {
        updateLead(lead.id, {
          ...parsedData,
          updatedAt: new Date(),
        });

        toast({
          title: 'Lead Updated',
          description: `${data.name} has been successfully updated.`,
        });
      } else {
        const newLead = {
          id: `lead-${uuidv4().slice(0, 8)}`,
          ...parsedData,
          aiPriorityScore: 0.5,
          createdAt: new Date(),
          updatedAt: new Date(),
          collaborators: [],
        };

        addLead(newLead);

        toast({
          title: 'Lead Created',
          description: `${data.name} has been successfully added.`,
        });
      }

      navigate({ to: '/crm/leads' });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      toast({
        title: 'Error',
        description: errorMessage.includes('Invalid')
          ? errorMessage
          : 'There was a problem saving the lead. Please try again.',
        variant: 'destructive',
      });
      console.error('Error saving lead:', error);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() =>
              navigate({
                to: isEditMode ? `/crm/leads/${id}` : '/crm/leads',
              })
            }
            className='mr-2'
          >
            <ArrowLeft className='h-4 w-4 mr-1' />
            Back
          </Button>
          <h1 className='text-2xl font-bold tracking-tight'>
            {isEditMode ? 'Edit Lead' : 'Create New Lead'}
          </h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder='Full name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='status'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select status' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={LeadStatus.NEW}>New</SelectItem>
                            <SelectItem value={LeadStatus.CONTACTED}>
                              Contacted
                            </SelectItem>
                            <SelectItem value={LeadStatus.QUALIFIED}>
                              Qualified
                            </SelectItem>
                            <SelectItem value={LeadStatus.PROPOSAL}>
                              Proposal
                            </SelectItem>
                            <SelectItem value={LeadStatus.NEGOTIATION}>
                              Negotiation
                            </SelectItem>
                            <SelectItem value={LeadStatus.BOOKED}>
                              Booked
                            </SelectItem>
                            <SelectItem value={LeadStatus.LOST}>
                              Lost
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='source'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select source' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={LeadSource.WEBSITE}>
                              Website
                            </SelectItem>
                            <SelectItem value={LeadSource.REFERRAL}>
                              Referral
                            </SelectItem>
                            <SelectItem value={LeadSource.SOCIAL}>
                              Social Media
                            </SelectItem>
                            <SelectItem value={LeadSource.EMAIL}>
                              Email
                            </SelectItem>
                            <SelectItem value={LeadSource.PHONE}>
                              Phone
                            </SelectItem>
                            <SelectItem value={LeadSource.WHATSAPP}>
                              WhatsApp
                            </SelectItem>
                            <SelectItem value={LeadSource.MARKETPLACE}>
                              Marketplace
                            </SelectItem>
                            <SelectItem value={LeadSource.OTHER}>
                              Other
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='email@example.com'
                          type='email'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder='+1234567890' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='budget'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget</FormLabel>
                    <FormControl>
                      <Input placeholder='5000' type='number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='tags'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='family, beach, summer (comma separated)'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='notes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Enter any additional notes about this lead'
                        {...field}
                        className='min-h-[100px]'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Travel Preferences</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <FormField
                control={form.control}
                name='destination'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <FormControl>
                      <Input placeholder='Hawaii, Paris, etc.' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='travelStartDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Travel Start Date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='travelEndDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Travel End Date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='accommodation'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accommodation Preference</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Resort, Hotel, Airbnb, etc.'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='activities'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Activities</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Beach, Hiking, Sightseeing, etc.'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className='flex justify-end space-x-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() =>
                navigate({
                  to: isEditMode ? `/crm/leads/${id}` : '/crm/leads',
                })
              }
            >
              <X className='mr-2 h-4 w-4' /> Cancel
            </Button>
            <Button type='submit' disabled={isOffline && !isEditMode}>
              <Save className='mr-2 h-4 w-4' />{' '}
              {isEditMode ? 'Update Lead' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default LeadFormPage;
