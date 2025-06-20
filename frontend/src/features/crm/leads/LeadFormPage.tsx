import { zodResolver } from '@hookform/resolvers/zod';
import { isValid } from 'date-fns';
import { ArrowLeft, Save, X, X as XIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';

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
import { RootState } from '@/store';
import {
  useLeadAddMutation,
  useLeadUpdateMutation,
  useLeadGetByIdQuery,
} from '@/store/api/Services/leadApi';

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
import { Badge } from '@/components/ui/badge';

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
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  status: z.nativeEnum(LeadStatus),
  source: z.nativeEnum(LeadSource),
  assignedTo: z.string().optional().or(z.literal('')),
  destination: z.string().optional().or(z.literal('')),
  departureDate: z.string().optional().or(z.literal('')),
  returnDate: z.string().optional().or(z.literal('')),
  budgetValue: z.string().optional().or(z.literal('')),
  budgetCurrency: z.string().default('INR'),
  accommodation: z.string().optional().or(z.literal('')),
  specialRequests: z.string().optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')), // Will be split by comma
  notes: z.string().optional().or(z.literal('')),
  nextFollowUp: z.string().optional().or(z.literal('')),
  followUpReason: z.string().optional().or(z.literal('')),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

const LeadFormPage: React.FC = () => {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();
  const { leads, addLead, updateLead, isOffline } = useCrmStore();
  const isEditMode = Boolean(id);
  const { user } = useSelector((state: RootState) => state.user);
  const [leadAdd] = useLeadAddMutation();
  const [leadUpdate] = useLeadUpdateMutation();

  // API call to get lead by ID in edit mode
  const {
    data: apiResponse,
    isLoading: isLoadingLead,
    error: leadError,
  } = useLeadGetByIdQuery(id!, {
    skip: !isEditMode || !id,
  });

  // Local state for form data management
  const [localFormData, setLocalFormData] = useState<LeadFormValues | null>(
    null
  );
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Find lead if in edit mode - prioritize API data over local store
  const apiLead = apiResponse?.data;
  const localLead = leads.find(l => l._id === id);
  const lead = apiLead || localLead;

  // Initialize form with safely formatted dates
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      fullName: lead?.fullName || '',
      email: lead?.email || '',
      phone: lead?.phone || '',
      status: lead?.status || LeadStatus.NEW,
      source: lead?.source || LeadSource.WEBSITE,
      assignedTo: lead?.assignedTo || user?.id || '',
      destination: lead?.travelDetails?.destination || '',
      departureDate: lead?.travelDetails?.departureDate
        ? formatSafeDate(lead.travelDetails.departureDate)
        : '',
      returnDate: lead?.travelDetails?.returnDate
        ? formatSafeDate(lead.travelDetails.returnDate)
        : '',
      budgetValue: lead?.travelDetails?.budget?.value
        ? String(lead.travelDetails.budget.value)
        : '',
      budgetCurrency: lead?.travelDetails?.budget?.currency || 'INR',
      accommodation: lead?.travelDetails?.preferences?.accommodation || '',
      specialRequests: lead?.travelDetails?.preferences?.specialRequests || '',
      tags: lead?.tags.join(', ') || '',
      notes: lead?.notes || '',
      nextFollowUp: lead?.nextFollowUp ? formatSafeDate(lead.nextFollowUp) : '',
      followUpReason: lead?.followUpReason || '',
    },
  });

  // Update form when lead data is loaded
  useEffect(() => {
    if (lead && isEditMode) {
      form.reset({
        fullName: lead.fullName || '',
        email: lead.email || '',
        phone: lead.phone || '',
        status: lead.status || LeadStatus.NEW,
        source: lead.source || LeadSource.WEBSITE,
        assignedTo: lead.assignedTo || user?.id || '',
        destination: lead.travelDetails?.destination || '',
        departureDate: lead.travelDetails?.departureDate
          ? formatSafeDate(lead.travelDetails.departureDate)
          : '',
        returnDate: lead.travelDetails?.returnDate
          ? formatSafeDate(lead.travelDetails.returnDate)
          : '',
        budgetValue: lead.travelDetails?.budget?.value
          ? String(lead.travelDetails.budget.value)
          : '',
        budgetCurrency: lead.travelDetails?.budget?.currency || 'INR',
        accommodation: lead.travelDetails?.preferences?.accommodation || '',
        specialRequests: lead.travelDetails?.preferences?.specialRequests || '',
        tags: lead.tags.join(', ') || '',
        notes: lead.notes || '',
        nextFollowUp: lead.nextFollowUp
          ? formatSafeDate(lead.nextFollowUp)
          : '',
        followUpReason: lead.followUpReason || '',
      });

      // Ensure assignedTo field value is set correctly
      if (lead.assignedTo) {
        form.setValue('assignedTo', lead.assignedTo);
      } else if (user?.id) {
        form.setValue('assignedTo', user.id);
      }
    }
  }, [lead, isEditMode, form, user?.id]);

  // Initialize tags from form
  useEffect(() => {
    if (lead?.tags) {
      setTags(lead.tags);
    }
  }, [lead]);

  // Update assignedTo field when user data loads
  useEffect(() => {
    console.log('User effect triggered:', user);
    if (user?.id) {
      console.log('Setting assignedTo to:', user.id);
      if (!isEditMode) {
        // For new leads, always set to current user
        form.setValue('assignedTo', user.id);
      } else if (!lead?.assignedTo) {
        // For existing leads without assignment, set to current user
        form.setValue('assignedTo', user.id);
      }
    }
  }, [user, isEditMode, form, lead?.assignedTo]);

  // Debug logging for edit mode
  useEffect(() => {
    if (isEditMode) {
      console.log('Edit mode debug:', {
        id,
        lead,
        apiResponse,
        isLoadingLead,
        leadError,
        isOffline,
      });
    }
  }, [isEditMode, id, lead, apiResponse, isLoadingLead, leadError, isOffline]);

  // Handle tag input changes
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);

    // Check if comma is entered
    if (value.includes(',')) {
      const newTag = value.replace(',', '').trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        form.setValue('tags', [...tags, newTag].join(', '));
      }
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    form.setValue('tags', newTags.join(', '));
  };

  // Handle phone number input - only allow numbers and special characters
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers, +, -, (, ), and spaces
    const phoneRegex = /^[\d\s+\-()]*$/;
    if (phoneRegex.test(value) || value === '') {
      form.setValue('phone', value);
    }
  };

  // Get minimum date for departure (today)
  const getMinDepartureDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get minimum date for return (departure date + 1 day)
  const getMinReturnDate = () => {
    const departureDate = form.watch('departureDate');
    if (!departureDate) return getMinDepartureDate();

    const minReturn = new Date(departureDate);
    minReturn.setDate(minReturn.getDate() + 1);
    return minReturn.toISOString().split('T')[0];
  };

  // Handle departure date change
  const handleDepartureDateChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newDepartureDate = e.target.value;
    form.setValue('departureDate', newDepartureDate);

    // If return date is before new departure date, clear it
    const currentReturnDate = form.watch('returnDate');
    if (
      currentReturnDate &&
      newDepartureDate &&
      currentReturnDate <= newDepartureDate
    ) {
      form.setValue('returnDate', '');
    }
  };

  // Handle return date change
  const handleReturnDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newReturnDate = e.target.value;
    const departureDate = form.watch('departureDate');

    if (departureDate && newReturnDate && newReturnDate <= departureDate) {
      toast({
        title: 'Invalid Date',
        description: 'Return date must be after departure date.',
        variant: 'destructive',
      });
      return;
    }

    form.setValue('returnDate', newReturnDate);
  };

  // Handle next follow-up date change
  const handleNextFollowUpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFollowUpDate = e.target.value;
    const today = new Date().toISOString().split('T')[0];

    if (newFollowUpDate && newFollowUpDate < today) {
      toast({
        title: 'Invalid Date',
        description: 'Follow-up date cannot be in the past.',
        variant: 'destructive',
      });
      return;
    }

    form.setValue('nextFollowUp', newFollowUpDate);
  };

  // Save form data to local state
  const saveToLocalState = () => {
    const formData = form.getValues();
    setLocalFormData(formData);
    localStorage.setItem('leadFormDraft', JSON.stringify(formData));
  };

  // Load form data from local state
  const loadFromLocalState = () => {
    const saved = localStorage.getItem('leadFormDraft');
    if (saved && !isEditMode) {
      try {
        const formData = JSON.parse(saved);
        Object.keys(formData).forEach(key => {
          form.setValue(key as keyof LeadFormValues, formData[key]);
        });
        setLocalFormData(formData);
      } catch (error) {
        console.error('Error loading form data:', error);
      }
    }
  };

  // Clear local state
  const clearLocalState = () => {
    setLocalFormData(null);
    localStorage.removeItem('leadFormDraft');
  };

  // Auto-save form data on changes
  useEffect(() => {
    const subscription = form.watch(value => {
      if (!isEditMode) {
        saveToLocalState();
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isEditMode]);

  // Load saved data on mount
  useEffect(() => {
    if (!isEditMode) {
      loadFromLocalState();
    }
  }, [isEditMode]);

  // Loading state for edit mode
  if (isEditMode && isLoadingLead) {
    return (
      <div className='flex flex-col items-center justify-center h-[70vh]'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900'></div>
        <h2 className='text-2xl font-bold mt-4'>Loading Lead...</h2>
        <p className='text-muted-foreground mt-2'>
          Fetching lead data for editing...
        </p>
      </div>
    );
  }

  // Error state for edit mode
  if (isEditMode && leadError && !localLead) {
    return (
      <div className='flex flex-col items-center justify-center h-[70vh]'>
        <h2 className='text-2xl font-bold'>Error Loading Lead</h2>
        <p className='text-muted-foreground mt-2'>
          There was an error loading the lead data for editing.
        </p>
        <div className='flex gap-2 mt-4'>
          <Button
            variant='outline'
            onClick={() => navigate({ to: '/crm/leads' })}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  // Not found state for edit mode
  if (isEditMode && !lead) {
    return (
      <div className='flex flex-col items-center justify-center h-[70vh]'>
        <h2 className='text-2xl font-bold'>Lead Not Found</h2>
        <p className='text-muted-foreground mt-2'>
          The lead you're trying to edit doesn't exist.
        </p>
        <Button className='mt-4' onClick={() => navigate({ to: '/crm/leads' })}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Leads
        </Button>
      </div>
    );
  }

  // Handle form submission
  const onSubmit = async (data: LeadFormValues) => {
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
        fullName: data.fullName,
        email: data.email || undefined,
        phone: data.phone || undefined,
        status: data.status,
        source: data.source,
        assignedTo: data.assignedTo || undefined,
        travelDetails: {
          destination: data.destination || undefined,
          departureDate: data.departureDate || undefined,
          returnDate: data.returnDate || undefined,
          budget: data.budgetValue
            ? {
                currency: data.budgetCurrency,
                value: Number(data.budgetValue),
              }
            : undefined,
          preferences: {
            ...(data.accommodation
              ? { accommodation: data.accommodation }
              : {}),
            ...(data.specialRequests
              ? { specialRequests: data.specialRequests }
              : {}),
          },
        },
        tags: tags,
        notes: data.notes || undefined,
        nextFollowUp: data.nextFollowUp || undefined,
        followUpReason: data.followUpReason || undefined,
      };

      // Validate dates before saving
      if (parsedData.travelDetails.departureDate) {
        const departureDate = new Date(parsedData.travelDetails.departureDate);
        if (!isValid(departureDate)) {
          throw new Error('Invalid departure date');
        }
      }

      if (parsedData.travelDetails.returnDate) {
        const returnDate = new Date(parsedData.travelDetails.returnDate);
        if (!isValid(returnDate)) {
          throw new Error('Invalid return date');
        }
      }

      if (isEditMode && lead) {
        // Update existing lead
        if (!isOffline) {
          // Use API if online
          await leadUpdate({
            id: lead._id,
            ...parsedData,
          }).unwrap();
        } else {
          // Use local store if offline
          updateLead(lead._id, {
            ...parsedData,
            updatedAt: new Date(),
          });
        }

        toast({
          title: 'Lead Updated',
          description: `${data.fullName} has been successfully updated.`,
        });
      } else {
        // Create new lead
        if (!isOffline) {
          // Use API if online
          const response = await leadAdd(parsedData).unwrap();
          // Also add to local store for immediate UI update
          addLead(response.data);
        } else {
          // Use local store if offline
          const newLead = {
            id: `lead-${uuidv4().slice(0, 8)}`,
            ...parsedData,
            aiPriorityScore: 0.5,
            createdAt: new Date(),
            updatedAt: new Date(),
            collaborators: [],
          };
          addLead(newLead);
        }

        toast({
          title: 'Lead Created',
          description: `${data.fullName} has been successfully added.`,
        });
      }

      // Clear local state after successful submission
      clearLocalState();
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

  // Handle cancel
  const handleCancel = () => {
    clearLocalState();
    navigate({
      to: isEditMode ? `/crm/leads/${id}` : '/crm/leads',
    });
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleCancel}
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
                  name='fullName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder='Full name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='assignedTo'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            user
                              ? `${user.firstName} ${user.lastName}`
                              : 'Loading user...'
                          }
                          value={
                            user ? `${user.firstName} ${user.lastName}` : ''
                          }
                          readOnly
                          className='bg-muted'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                          <SelectItem value={LeadStatus.LOST}>Lost</SelectItem>
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
                        <Input
                          placeholder='+1234567890'
                          value={field.value}
                          onChange={handlePhoneChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='budgetValue'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Value</FormLabel>
                      <FormControl>
                        <Input placeholder='5000' type='number' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='budgetCurrency'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select currency' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='INR'>INR</SelectItem>
                          <SelectItem value='USD'>USD</SelectItem>
                          <SelectItem value='EUR'>EUR</SelectItem>
                          <SelectItem value='GBP'>GBP</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='tags'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <div className='space-y-2'>
                        <Input
                          placeholder='family, beach, summer (press comma to add)'
                          value={tagInput}
                          onChange={handleTagInputChange}
                          onBlur={() => {
                            // Add any remaining text as a tag when input loses focus
                            if (
                              tagInput.trim() &&
                              !tags.includes(tagInput.trim())
                            ) {
                              const newTags = [...tags, tagInput.trim()];
                              setTags(newTags);
                              form.setValue('tags', newTags.join(', '));
                              setTagInput('');
                            }
                          }}
                        />
                        {tags.length > 0 && (
                          <div className='flex flex-wrap gap-2'>
                            {tags.map((tag, index) => (
                              <Badge
                                key={index}
                                variant='secondary'
                                className='gap-1'
                              >
                                {tag}
                                <button
                                  type='button'
                                  onClick={() => removeTag(tag)}
                                  className='ml-1 hover:text-destructive'
                                >
                                  <XIcon className='h-3 w-3' />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
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
              <CardTitle>Travel Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <FormField
                control={form.control}
                name='destination'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <FormControl>
                      <Input placeholder='Bali, Indonesia' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='departureDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Date</FormLabel>
                      <FormControl>
                        <Input
                          type='date'
                          min={getMinDepartureDate()}
                          {...field}
                          onClick={e => e.currentTarget.showPicker?.()}
                          onChange={handleDepartureDateChange}
                        />
                      </FormControl>
                      <p className='text-xs text-muted-foreground'>
                        Select departure date (cannot be in the past)
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='returnDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Return Date</FormLabel>
                      <FormControl>
                        <Input
                          type='date'
                          min={getMinReturnDate()}
                          disabled={!form.watch('departureDate')}
                          {...field}
                          onClick={e => e.currentTarget.showPicker?.()}
                          onChange={handleReturnDateChange}
                        />
                      </FormControl>
                      <p className='text-xs text-muted-foreground'>
                        {!form.watch('departureDate')
                          ? 'Select departure date first'
                          : 'Must be after departure date'}
                      </p>
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
                      <Input placeholder='5-star hotel' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='specialRequests'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Requests</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Ocean view room preferred'
                        {...field}
                        className='min-h-[100px]'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='nextFollowUp'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Follow-up Date</FormLabel>
                      <FormControl>
                        <Input
                          type='date'
                          min={getMinDepartureDate()}
                          {...field}
                          onClick={e => e.currentTarget.showPicker?.()}
                          onChange={handleNextFollowUpChange}
                        />
                      </FormControl>
                      <p className='text-xs text-muted-foreground'>
                        Select when to follow up (cannot be in the past)
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='followUpReason'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Follow-up Reason</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Discuss package details and pricing'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className='flex justify-end space-x-2'>
            <Button type='button' variant='outline' onClick={handleCancel}>
              <XIcon className='mr-2 h-4 w-4' /> Cancel
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
