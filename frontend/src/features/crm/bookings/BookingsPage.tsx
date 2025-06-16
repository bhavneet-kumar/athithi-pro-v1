import { format } from 'date-fns';
import { FileCheck, Plus, File, ClipboardCheck } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCrmStore } from '@/lib/store';

const BookingsPage: React.FC = () => {
  const { bookings, leads } = useCrmStore();

  // Create map of lead IDs to names
  const leadMap = leads.reduce(
    (acc, lead) => {
      acc[lead.id] = lead.name;
      return acc;
    },
    {} as Record<string, string>
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant='outline' className='bg-gray-100'>
            Draft
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge variant='outline' className='bg-blue-100 text-blue-800'>
            Confirmed
          </Badge>
        );
      case 'paid':
        return (
          <Badge variant='outline' className='bg-green-100 text-green-800'>
            Paid
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant='outline' className='bg-purple-100 text-purple-800'>
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant='outline' className='bg-red-100 text-red-800'>
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Bookings</h1>
          <p className='text-muted-foreground'>
            Manage your confirmed bookings and payments
          </p>
        </div>

        <Button>
          <Plus className='mr-2 h-4 w-4' />
          New Booking
        </Button>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='text-2xl font-bold'>{bookings.length}</div>
            <p className='text-xs text-muted-foreground'>All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Booking Value</CardTitle>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='text-2xl font-bold'>
              $
              {bookings
                .reduce((sum, b) => sum + b.totalAmount, 0)
                .toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>Total value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Received Payments
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='text-2xl font-bold'>
              $
              {bookings
                .reduce((sum, b) => sum + b.paidAmount, 0)
                .toLocaleString()}
            </div>
            <p className='text-xs text-green-600'>Secured revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Outstanding</CardTitle>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='text-2xl font-bold'>
              $
              {bookings
                .reduce((sum, b) => sum + (b.totalAmount - b.paidAmount), 0)
                .toLocaleString()}
            </div>
            <p className='text-xs text-yellow-600'>Pending payments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Itinerary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map(booking => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      {leadMap[booking.leadId] || 'Unknown Client'}
                    </TableCell>
                    <TableCell>
                      {booking.itinerary?.name || 'No itinerary'}
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>
                      {format(new Date(booking.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      ${booking.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Progress
                          value={
                            (booking.paidAmount / booking.totalAmount) * 100
                          }
                          className='h-2'
                        />
                        <span className='text-xs'>
                          {Math.round(
                            (booking.paidAmount / booking.totalAmount) * 100
                          )}
                          %
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='text-right space-x-1'>
                      <Button variant='ghost' size='sm'>
                        <File className='h-4 w-4' />
                        <span className='sr-only'>View Details</span>
                      </Button>
                      <Button variant='ghost' size='sm'>
                        <ClipboardCheck className='h-4 w-4' />
                        <span className='sr-only'>Update Payment</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className='flex flex-col items-center justify-center p-8 text-center'>
              <div className='rounded-full bg-muted p-6 mb-4'>
                <FileCheck className='h-10 w-10 text-muted-foreground' />
              </div>
              <h3 className='text-lg font-medium'>No bookings yet</h3>
              <p className='text-muted-foreground mt-2 mb-4 max-w-sm'>
                When you confirm a booking with a client, it will appear here.
              </p>
              <Button>
                <Plus className='mr-2 h-4 w-4' />
                Create First Booking
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingsPage;
