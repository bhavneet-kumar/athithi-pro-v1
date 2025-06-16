import { format } from 'date-fns';
import { Calendar, Plus, CheckCircle, Clock } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCrmStore } from '@/lib/store';
import type { Task } from '@/types/crm';
import { TaskPriority } from '@/types/crm';

const TasksPage: React.FC = () => {
  const { tasks, toggleTaskCompletion } = useCrmStore();

  const overdueTasks = tasks.filter(
    task => !task.completed && new Date(task.dueDate) < new Date()
  );

  const todayTasks = tasks.filter(
    task =>
      !task.completed &&
      new Date(task.dueDate).toDateString() === new Date().toDateString()
  );

  const upcomingTasks = tasks.filter(
    task =>
      !task.completed &&
      new Date(task.dueDate) > new Date() &&
      new Date(task.dueDate).toDateString() !== new Date().toDateString()
  );

  const completedTasks = tasks.filter(task => task.completed);

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'bg-red-100 text-red-800';
      case TaskPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case TaskPriority.LOW:
        return 'bg-green-100 text-green-800';
      case TaskPriority.URGENT:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <Card className='mb-3'>
      <CardContent className='p-4'>
        <div className='flex items-start gap-3'>
          <Checkbox
            checked={task.completed}
            onCheckedChange={checked =>
              toggleTaskCompletion(task.id, checked === true)
            }
          />
          <div className='flex-1'>
            <div className='flex items-center justify-between'>
              <h4
                className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}
              >
                {task.title}
              </h4>
              <Badge
                variant='outline'
                className={getPriorityColor(task.priority)}
              >
                {task.priority}
              </Badge>
            </div>
            {task.description && (
              <p className='text-sm text-muted-foreground mt-1'>
                {task.description}
              </p>
            )}
            <div className='flex items-center mt-2 text-xs'>
              <Clock className='h-3 w-3 mr-1 text-muted-foreground' />
              <span>
                Due:{' '}
                {format(new Date(task.dueDate), "MMMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Tasks & Follow-ups
          </h1>
          <p className='text-muted-foreground'>
            Manage your tasks and never miss a follow-up
          </p>
        </div>

        <Button>
          <Plus className='mr-2 h-4 w-4' />
          New Task
        </Button>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Overdue</CardTitle>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='text-2xl font-bold'>{overdueTasks.length}</div>
            <p className='text-xs text-red-600'>Needs attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Due Today</CardTitle>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='text-2xl font-bold'>{todayTasks.length}</div>
            <p className='text-xs text-muted-foreground'>Tasks to complete</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Upcoming</CardTitle>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='text-2xl font-bold'>{upcomingTasks.length}</div>
            <p className='text-xs text-muted-foreground'>Future tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Completed</CardTitle>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='text-2xl font-bold'>{completedTasks.length}</div>
            <p className='text-xs text-green-600'>Good job!</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='all' className='w-full'>
        <TabsList>
          <TabsTrigger value='all'>All Tasks</TabsTrigger>
          <TabsTrigger value='today'>Today</TabsTrigger>
          <TabsTrigger value='upcoming'>Upcoming</TabsTrigger>
          <TabsTrigger value='completed'>Completed</TabsTrigger>
        </TabsList>

        <TabsContent value='all' className='mt-6'>
          <h2 className='text-lg font-medium mb-4'>All Tasks</h2>
          {tasks.length > 0 ? (
            <div>
              {overdueTasks.length > 0 && (
                <div className='mb-6'>
                  <div className='flex items-center mb-3'>
                    <Clock className='text-red-500 mr-2 h-4 w-4' />
                    <h3 className='font-medium text-red-500'>Overdue</h3>
                  </div>
                  {overdueTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}

              {todayTasks.length > 0 && (
                <div className='mb-6'>
                  <div className='flex items-center mb-3'>
                    <Calendar className='text-blue-500 mr-2 h-4 w-4' />
                    <h3 className='font-medium'>Today</h3>
                  </div>
                  {todayTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}

              {upcomingTasks.length > 0 && (
                <div className='mb-6'>
                  <div className='flex items-center mb-3'>
                    <Calendar className='text-gray-500 mr-2 h-4 w-4' />
                    <h3 className='font-medium'>Upcoming</h3>
                  </div>
                  {upcomingTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}

              {completedTasks.length > 0 && (
                <div>
                  <div className='flex items-center mb-3'>
                    <CheckCircle className='text-green-500 mr-2 h-4 w-4' />
                    <h3 className='font-medium'>Completed</h3>
                  </div>
                  {completedTasks.slice(0, 5).map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {completedTasks.length > 5 && (
                    <Button variant='link' className='mt-2'>
                      View all {completedTasks.length} completed tasks
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Card className='p-8 text-center'>
              <div className='mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4'>
                <Calendar className='h-6 w-6 text-muted-foreground' />
              </div>
              <h3 className='text-lg font-medium'>No tasks yet</h3>
              <p className='text-muted-foreground mt-2 mb-4'>
                Create a new task to get started
              </p>
              <Button>
                <Plus className='mr-2 h-4 w-4' />
                New Task
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value='today'>
          <div className='mt-6'>
            <h2 className='text-lg font-medium mb-4'>Today's Tasks</h2>
            {todayTasks.length > 0 ? (
              todayTasks.map(task => <TaskCard key={task.id} task={task} />)
            ) : (
              <Card className='p-6 text-center'>
                <p className='text-muted-foreground'>
                  No tasks scheduled for today
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value='upcoming'>
          <div className='mt-6'>
            <h2 className='text-lg font-medium mb-4'>Upcoming Tasks</h2>
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map(task => <TaskCard key={task.id} task={task} />)
            ) : (
              <Card className='p-6 text-center'>
                <p className='text-muted-foreground'>
                  No upcoming tasks scheduled
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value='completed'>
          <div className='mt-6'>
            <h2 className='text-lg font-medium mb-4'>Completed Tasks</h2>
            {completedTasks.length > 0 ? (
              completedTasks.map(task => <TaskCard key={task.id} task={task} />)
            ) : (
              <Card className='p-6 text-center'>
                <p className='text-muted-foreground'>No completed tasks yet</p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TasksPage;
