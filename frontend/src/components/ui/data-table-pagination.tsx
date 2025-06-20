import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { PaginationMeta } from '@/hooks/useServerPagination';

interface DataTablePaginationProps {
  paginationMeta: PaginationMeta;
  pageIndex: number;
  pageSize: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showPageInfo?: boolean;
  showNavigationButtons?: boolean;
}

/**
 * A professional server-side pagination component for data tables.
 *
 * This component provides a complete pagination UI that works seamlessly
 * with the useServerPagination hook and TanStack React Table.
 *
 * @example
 * ```tsx
 * const {
 *   pagination,
 *   paginationMeta,
 *   setPageIndex,
 *   setPageSize
 * } = useServerPagination({ total: 100 });
 *
 * return (
 *   <DataTablePagination
 *     paginationMeta={paginationMeta}
 *     pageIndex={pagination.pageIndex}
 *     pageSize={pagination.pageSize}
 *     onPageChange={setPageIndex}
 *     onPageSizeChange={setPageSize}
 *   />
 * );
 * ```
 */
export function DataTablePagination({
  paginationMeta,
  pageIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 30, 40, 50],
  showPageSizeSelector = true,
  showPageInfo = true,
  showNavigationButtons = true,
}: DataTablePaginationProps) {
  const { total, totalPages, hasNextPage, hasPreviousPage } = paginationMeta;

  const startItem = pageIndex * pageSize + 1;
  const endItem = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className='flex items-center justify-between space-x-2 py-4'>
      {showPageInfo && (
        <div className='flex-1 text-sm text-muted-foreground'>
          Showing {startItem} to {endItem} of {total} results
        </div>
      )}

      <div className='flex items-center space-x-6 lg:space-x-8'>
        {showPageSizeSelector && (
          <div className='flex items-center space-x-2'>
            <p className='text-sm font-medium'>Rows per page</p>
            <Select
              value={pageSize.toString()}
              onValueChange={value => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className='h-8 w-[70px]'>
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side='top'>
                {pageSizeOptions.map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showPageInfo && (
          <div className='flex w-[100px] items-center justify-center text-sm font-medium'>
            Page {pageIndex + 1} of {totalPages}
          </div>
        )}

        {showNavigationButtons && (
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              className='hidden h-8 w-8 p-0 lg:flex'
              onClick={() => onPageChange(0)}
              disabled={!hasPreviousPage}
            >
              <span className='sr-only'>Go to first page</span>
              <ChevronsLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='h-8 w-8 p-0'
              onClick={() => onPageChange(pageIndex - 1)}
              disabled={!hasPreviousPage}
            >
              <span className='sr-only'>Go to previous page</span>
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='h-8 w-8 p-0'
              onClick={() => onPageChange(pageIndex + 1)}
              disabled={!hasNextPage}
            >
              <span className='sr-only'>Go to next page</span>
              <ChevronRight className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='hidden h-8 w-8 p-0 lg:flex'
              onClick={() => onPageChange(totalPages - 1)}
              disabled={!hasNextPage}
            >
              <span className='sr-only'>Go to last page</span>
              <ChevronsRight className='h-4 w-4' />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
