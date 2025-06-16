import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, X } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Textarea } from '@/components/ui/textarea';
import { useCrmStore } from '@/lib/store';

import { TaskType, TaskPriority } from '@/types/crm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().or(z.literal('')),
  type: z.nativeEnum(TaskType),
  priority: z.nativeEnum(TaskPriority),
  dueDate: z.string().min(1, 'Due date is required'),
  dueTime: z.string().min(1, 'Due time is required'),
  leadId: z.string().optional().or(z.literal('')),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const TaskFormPage: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { leads, tasks, addTask, isOffline } = useCrmStore();

  // Initialize form
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      type: TaskType.FOLLOW_UP,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '12:00',
      leadId: leadId || '',
    },
  });

  // Handle form submission
  const onSubmit = (data: TaskFormValues) => {
    if (isOffline) {
      toast({
        title: 'Offline Mode',
        description: "Task will be created when you're back online.",
        variant: 'default',
      });
    }

    try {
      const [year, month, day] = data.dueDate.split('-').map(Number);
      const [hours, minutes] = data.dueTime.split(':').map(Number);

      const dueDateTime = new Date(year, month - 1, day, hours, minutes);

      const newTask = {
        id: `task-${uuidv4().slice(0, 8)}`,
        title: data.title,
        description: data.description || undefined,
        type: data.type,
        priority: data.priority,
        dueDate: dueDateTime,
        completed: false,
        leadId: data.leadId || undefined,
        assignedTo: 'agent-1', // Hard-coded for now, would be the current user in a real app
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addTask(newTask);

      toast({
        title: 'Task Created',
        description: `"${data.title}" has been successfully added.`,
      });

      if (data.leadId) {
        navigate(`/crm/leads/${data.leadId}`);
      } else {
        navigate('/crm/tasks');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was a problem creating the task. Please try again.',
        variant: 'destructive',
      });
      console.error('Error creating task:', error);
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
              navigate(leadId ? `/crm/leads/${leadId}` : '/crm/tasks')
            }
            className='mr-2'
          >
            <ArrowLeft className='h-4 w-4 mr-1' />
            Back
          </Button>
          <h1 className='text-2xl font-bold tracking-tight'>Create New Task</h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder='Task title' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='type'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TaskType.CALL}>Call</SelectItem>
                          <SelectItem value={TaskType.EMAIL}>Email</SelectItem>
                          <SelectItem value={TaskType.MEETING}>
                            Meeting
                          </SelectItem>
                          <SelectItem value={TaskType.DOCUMENT}>
                            Document
                          </SelectItem>
                          <SelectItem value={TaskType.FOLLOW_UP}>
                            Follow Up
                          </SelectItem>
                          <SelectItem value={TaskType.OTHER}>Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='priority'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select priority' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                          <SelectItem value={TaskPriority.MEDIUM}>
                            Medium
                          </SelectItem>
                          <SelectItem value={TaskPriority.HIGH}>
                            High
                          </SelectItem>
                          <SelectItem value={TaskPriority.URGENT}>
                            Urgent
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
                  name='dueDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='dueTime'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Time</FormLabel>
                      <FormControl>
                        <Input type='time' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!leadId && (
                <FormField
                  control={form.control}
                  name='leadId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Associated Lead</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select a lead (optional)' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value=''>No associated lead</SelectItem>
                          {leads.map(lead => (
                            <SelectItem key={lead.id} value={lead.id}>
                              {lead.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Enter task details...'
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

          <div className='flex justify-end space-x-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() =>
                navigate(leadId ? `/crm/leads/${leadId}` : '/crm/tasks')
              }
            >
              <X className='mr-2 h-4 w-4' /> Cancel
            </Button>
            <Button type='submit' disabled={isOffline}>
              <Save className='mr-2 h-4 w-4' /> Create Task
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default TaskFormPage;
