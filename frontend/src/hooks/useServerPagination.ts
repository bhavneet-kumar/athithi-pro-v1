import { useCallback, useMemo, useState } from 'react';

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface PaginationMeta {
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UseServerPaginationOptions {
  initialPageIndex?: number;
  initialPageSize?: number;
  total?: number;
}

export interface UseServerPaginationReturn {
  pagination: PaginationState;
  paginationMeta: PaginationMeta;
  setPageIndex: (pageIndex: number) => void;
  setPageSize: (pageSize: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (pageIndex: number) => void;
  resetPagination: () => void;
  getPaginationParams: () => Record<string, string | number>;
}

/**
 * A professional server-side pagination hook for React applications.
 *
 * This hook provides a complete pagination solution that can be used with
 * TanStack React Table, REST APIs, or any other data fetching mechanism.
 *
 * @example
 * ```tsx
 * // Basic usage with TanStack React Table
 * const {
 *   pagination,
 *   paginationMeta,
 *   setPageIndex,
 *   setPageSize,
 *   getPaginationParams
 * } = useServerPagination({
 *   initialPageIndex: 0,
 *   initialPageSize: 10,
 *   total: 100
 * });
 *
 * // Use with API calls
 * const apiParams = getPaginationParams();
 * const { data } = useQuery(['items', apiParams], () =>
 *   fetchItems(apiParams)
 * );
 *
 * // Use with TanStack React Table
 * const table = useReactTable({
 *   data,
 *   columns,
 *   manualPagination: true,
 *   pageCount: paginationMeta.totalPages,
 *   state: { pagination },
 *   onPaginationChange: setPagination,
 * });
 * ```
 *
 * @param options - Configuration options for the pagination hook
 * @returns An object containing pagination state and utility functions
 */
export function useServerPagination({
  initialPageIndex = 0,
  initialPageSize = 10,
  total = 0,
}: UseServerPaginationOptions = {}): UseServerPaginationReturn {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: initialPageIndex,
    pageSize: initialPageSize,
  });

  const paginationMeta = useMemo((): PaginationMeta => {
    const totalPages = Math.ceil(total / pagination.pageSize);
    return {
      total,
      totalPages,
      hasNextPage: pagination.pageIndex < totalPages - 1,
      hasPreviousPage: pagination.pageIndex > 0,
    };
  }, [total, pagination.pageIndex, pagination.pageSize]);

  const setPageIndex = useCallback((pageIndex: number) => {
    setPagination(prev => ({ ...prev, pageIndex }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, pageIndex: 0 }));
  }, []);

  const nextPage = useCallback(() => {
    if (paginationMeta.hasNextPage) {
      setPageIndex(pagination.pageIndex + 1);
    }
  }, [pagination.pageIndex, paginationMeta.hasNextPage, setPageIndex]);

  const previousPage = useCallback(() => {
    if (paginationMeta.hasPreviousPage) {
      setPageIndex(pagination.pageIndex - 1);
    }
  }, [pagination.pageIndex, paginationMeta.hasPreviousPage, setPageIndex]);

  const goToPage = useCallback(
    (pageIndex: number) => {
      if (pageIndex >= 0 && pageIndex < paginationMeta.totalPages) {
        setPageIndex(pageIndex);
      }
    },
    [paginationMeta.totalPages, setPageIndex]
  );

  const resetPagination = useCallback(() => {
    setPagination({
      pageIndex: initialPageIndex,
      pageSize: initialPageSize,
    });
  }, [initialPageIndex, initialPageSize]);

  const getPaginationParams = useCallback(() => {
    return {
      page: pagination.pageIndex + 1, // API typically uses 1-based indexing
      limit: pagination.pageSize,
      skip: pagination.pageIndex * pagination.pageSize,
    };
  }, [pagination.pageIndex, pagination.pageSize]);

  return {
    pagination,
    paginationMeta,
    setPageIndex,
    setPageSize,
    nextPage,
    previousPage,
    goToPage,
    resetPagination,
    getPaginationParams,
  };
}
