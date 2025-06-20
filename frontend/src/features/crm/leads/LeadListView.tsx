import { format } from 'date-fns';
import {
  MoreHorizontal,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';

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
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/hooks/useCurrency';
import { useServerPagination } from '@/hooks/useServerPagination';
import { LeadStatus, LeadSource } from '@/types/crm';
import type { Lead } from '@/types/crm';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

interface LeadListViewProps {
  leads: Lead[];
  total: number;
  isLoading?: boolean;
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSearchChange?: (search: string) => void;
  onSortChange?: (sorting: SortingState) => void;
  pageIndex?: number;
  pageSize?: number;
  searchTerm?: string;
  sorting?: SortingState;
}

const LeadListView: React.FC<LeadListViewProps> = ({
  leads,
  total,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onSortChange,
  pageIndex = 0,
  pageSize = 10,
  searchTerm = '',
  sorting = [],
}) => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();

  // Server-side pagination hook
  const { paginationMeta, setPageIndex, setPageSize } = useServerPagination({
    initialPageIndex: pageIndex,
    initialPageSize: pageSize,
    total,
  });

  // Handle pagination changes
  const handlePageChange = (newPageIndex: number) => {
    setPageIndex(newPageIndex);
    onPageChange?.(newPageIndex);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    onPageSizeChange?.(newPageSize);
  };

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

  const getPriorityColor = (score: number) => {
    if (score > 70) return 'bg-red-500';
    if (score > 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: 'fullName',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-auto p-0 font-semibold'
          >
            Name
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className='ml-2 h-4 w-4' />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className='ml-2 h-4 w-4' />
            ) : (
              <ChevronsUpDown className='ml-2 h-4 w-4' />
            )}
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className='font-medium'>{row.getValue('fullName')}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }) => {
        const email = row.getValue('email') as string;
        const phone = row.original.phone;
        return (
          <div className='flex flex-col'>
            {email && <span className='text-xs md:text-sm'>{email}</span>}
            {phone && (
              <span className='text-xs text-muted-foreground'>{phone}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-auto p-0 font-semibold'
          >
            Status
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className='ml-2 h-4 w-4' />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className='ml-2 h-4 w-4' />
            ) : (
              <ChevronsUpDown className='ml-2 h-4 w-4' />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.getValue('status') as LeadStatus;
        return (
          <Badge variant='outline' className={getStatusColor(status)}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'source',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-auto p-0 font-semibold'
          >
            Source
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className='ml-2 h-4 w-4' />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className='ml-2 h-4 w-4' />
            ) : (
              <ChevronsUpDown className='ml-2 h-4 w-4' />
            )}
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className='capitalize'>{row.getValue('source')}</div>
      ),
    },
    {
      accessorKey: 'aiScore',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-auto p-0 font-semibold'
          >
            Priority
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className='ml-2 h-4 w-4' />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className='ml-2 h-4 w-4' />
            ) : (
              <ChevronsUpDown className='ml-2 h-4 w-4' />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const score = row.original.aiScore?.value || 50;
        return (
          <div className='flex items-center'>
            <div className='w-full bg-gray-200 rounded-full h-2.5'>
              <div
                className={`h-2.5 rounded-full ${getPriorityColor(score)}`}
                style={{ width: `${score}%` }}
              ></div>
            </div>
            <span className='ml-2 text-xs'>{score}</span>
          </div>
        );
      },
      sortingFn: (rowA, rowB) => {
        const scoreA = rowA.original.aiScore?.value || 50;
        const scoreB = rowB.original.aiScore?.value || 50;
        return scoreA - scoreB;
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-auto p-0 font-semibold'
          >
            Created
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className='ml-2 h-4 w-4' />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className='ml-2 h-4 w-4' />
            ) : (
              <ChevronsUpDown className='ml-2 h-4 w-4' />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return <div>{format(date, 'MMM d, yyyy')}</div>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                <span className='sr-only'>Open menu</span>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onClick={() => navigate({ to: `/crm/leads/${lead._id}` })}
              >
                <ArrowRight className='mr-2 h-4 w-4' />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate({ to: `/crm/leads/${lead._id}/edit` })}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>Add Task</DropdownMenuItem>
              <DropdownMenuItem>Send Message</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: leads,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: onSortChange,
    state: {
      sorting,
    },
    manualPagination: true,
    manualSorting: true,
    pageCount: paginationMeta.totalPages,
  });

  return (
    <div className='space-y-4'>
      {/* Table */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  <div className='flex items-center justify-center'>
                    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900'></div>
                    <span className='ml-2'>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className='cursor-pointer hover:bg-muted/50'
                  onClick={() =>
                    navigate({ to: `/crm/leads/${row.original._id}` })
                  }
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Server-side Pagination */}
      <DataTablePagination
        paginationMeta={paginationMeta}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};

export default LeadListView;
