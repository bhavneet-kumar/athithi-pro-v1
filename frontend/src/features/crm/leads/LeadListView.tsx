import { format } from 'date-fns';
import { MoreHorizontal, ArrowRight } from 'lucide-react';
import React from 'react';
import { useNavigate } from '@tanstack/react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { useCurrency } from '@/hooks/useCurrency';
import { LeadStatus } from '@/types/crm';
import type { Lead } from '@/types/crm';

interface LeadListViewProps {
  leads: Lead[];
}

const LeadListView: React.FC<LeadListViewProps> = ({ leads }) => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.NEW:
        return 'bg-blue-100 text-blue-800';
      case LeadStatus.CONTACTED:
        return 'bg-purple-100 text-purple-800';
      case LeadStatus.QUALIFIED:
        return 'bg-green-100 text-green-800';
      case LeadStatus.PROPOSAL:
        return 'bg-yellow-100 text-yellow-800';
      case LeadStatus.NEGOTIATION:
        return 'bg-orange-100 text-orange-800';
      case LeadStatus.BOOKED:
        return 'bg-green-100 text-green-800';
      case LeadStatus.LOST:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderBudget = (lead: Lead) => {
    if (lead.budget) {
      return formatCurrency(lead.budget);
    }
    return '';
  };

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[200px]'>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className='hidden md:table-cell'>Status</TableHead>
            <TableHead className='hidden md:table-cell'>Source</TableHead>
            <TableHead className='hidden lg:table-cell'>Priority</TableHead>
            <TableHead className='hidden xl:table-cell'>Created</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map(lead => (
            <TableRow
              key={lead.id}
              className='cursor-pointer hover:bg-muted/50'
              onClick={() => navigate({ to: `/crm/leads/${lead.id}` })}
            >
              <TableCell className='font-medium'>{lead.name}</TableCell>
              <TableCell>
                <div className='flex flex-col'>
                  {lead.email && (
                    <span className='text-xs md:text-sm'>{lead.email}</span>
                  )}
                  {lead.phone && (
                    <span className='text-xs text-muted-foreground'>
                      {lead.phone}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className='hidden md:table-cell'>
                <Badge
                  variant='outline'
                  className={getStatusColor(lead.status)}
                >
                  {lead.status}
                </Badge>
              </TableCell>
              <TableCell className='hidden md:table-cell capitalize'>
                {lead.source}
              </TableCell>
              <TableCell className='hidden lg:table-cell'>
                <div className='flex items-center'>
                  <div className='w-full bg-gray-200 rounded-full h-2.5'>
                    <div
                      className={`h-2.5 rounded-full ${
                        lead.aiPriorityScore > 0.7
                          ? 'bg-red-500'
                          : lead.aiPriorityScore > 0.4
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${lead.aiPriorityScore * 100}%` }}
                    ></div>
                  </div>
                  <span className='ml-2 text-xs'>
                    {Math.round(lead.aiPriorityScore * 100)}
                  </span>
                </div>
              </TableCell>
              <TableCell className='hidden xl:table-cell'>
                {format(lead.createdAt, 'MMM d, yyyy')}
              </TableCell>
              <TableCell className='text-right'>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={e => e.stopPropagation()}
                  >
                    <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                      <span className='sr-only'>Open menu</span>
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        navigate({ to: `/crm/leads/${lead.id}` });
                      }}
                    >
                      <ArrowRight className='mr-2 h-4 w-4' />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        // Add quick task
                      }}
                    >
                      Add Task
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        // Send message
                      }}
                    >
                      Send Message
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        // Edit lead
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LeadListView;
