import { useMemo } from 'react';
import { useUrlState } from './useUrlState';
import { LeadStatus } from '@/types/crm';
import type { SortingState } from '@tanstack/react-table';

export interface LeadsUrlState {
  page: number;
  limit: number;
  search: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  viewMode: 'list' | 'kanban';
  filters: {
    source: string;
    priority: string;
    dateRange: string;
    assignee: string;
  };
}

export interface UseLeadsUrlStateReturn {
  // Pagination
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;

  // Search and filtering
  search: string;
  status: string;
  setSearch: (search: string) => void;
  setStatus: (status: string) => void;

  // Sorting
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  setSorting: (sorting: SortingState) => void;

  // View mode
  viewMode: 'list' | 'kanban';
  setViewMode: (mode: 'list' | 'kanban') => void;

  // Advanced filters
  filters: {
    source: string;
    priority: string;
    dateRange: string;
    assignee: string;
  };
  setFilter: (key: keyof LeadsUrlState['filters'], value: string) => void;

  // Utility functions
  reset: () => void;
  hasChanges: boolean;

  // API parameters
  getApiParams: () => {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

/**
 * Specialized hook for managing leads URL state with pagination, filtering, and sorting.
 *
 * This hook provides a clean interface for managing all leads-related state
 * while automatically syncing with the URL for deep linking.
 *
 * @example
 * ```tsx
 * const {
 *   page,
 *   limit,
 *   search,
 *   status,
 *   setPage,
 *   setSearch,
 *   setStatus,
 *   getApiParams
 * } = useLeadsUrlState();
 *
 * // Update pagination
 * setPage(2);
 *
 * // Update search
 * setSearch('john');
 *
 * // Get API parameters
 * const apiParams = getApiParams();
 * ```
 */
export function useLeadsUrlState(): UseLeadsUrlStateReturn {
  const { state, setField, reset, hasChanges } = useUrlState<LeadsUrlState>({
    keyPrefix: 'leads',
    defaults: {
      page: 1,
      limit: 10,
      search: '',
      status: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      viewMode: 'list',
      filters: {
        source: 'all',
        priority: 'all',
        dateRange: 'all',
        assignee: 'all',
      },
    },
    serializers: {
      serialize: state => ({
        page: state.page,
        limit: state.limit,
        search: state.search,
        status: state.status,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        viewMode: state.viewMode,
        source: state.filters.source,
        priority: state.filters.priority,
        dateRange: state.filters.dateRange,
        assignee: state.filters.assignee,
      }),
      deserialize: params => ({
        page: Number(params.page) || 1,
        limit: Number(params.limit) || 10,
        search: String(params.search || ''),
        status: String(params.status || 'all'),
        sortBy: String(params.sortBy || 'createdAt'),
        sortOrder: String(params.sortOrder || 'desc') as 'asc' | 'desc',
        viewMode: String(params.viewMode || 'list') as 'list' | 'kanban',
        filters: {
          source: String(params.source || 'all'),
          priority: String(params.priority || 'all'),
          dateRange: String(params.dateRange || 'all'),
          assignee: String(params.assignee || 'all'),
        },
      }),
    },
    validate: state => {
      return (
        state.page > 0 &&
        state.limit > 0 &&
        state.limit <= 100 &&
        ['asc', 'desc'].includes(state.sortOrder) &&
        ['list', 'kanban'].includes(state.viewMode)
      );
    },
  });

  // Convenience setters
  const setPage = (page: number) => {
    try {
      console.log('setPage called with:', page);
      setField('page', Math.max(1, page));
    } catch (error) {
      console.error('Error in setPage:', error);
    }
  };
  const setLimit = (limit: number) =>
    setField('limit', Math.max(1, Math.min(100, limit)));
  const setSearch = (search: string) => setField('search', search);
  const setStatus = (status: string) => setField('status', status);
  const setViewMode = (viewMode: 'list' | 'kanban') =>
    setField('viewMode', viewMode);

  const setSorting = (sorting: SortingState) => {
    if (sorting.length > 0) {
      const sort = sorting[0];
      setField('sortBy', sort.id);
      setField('sortOrder', sort.desc ? 'desc' : 'asc');
    }
  };

  const setFilter = (key: keyof LeadsUrlState['filters'], value: string) => {
    setField('filters', { ...state.filters, [key]: value });
  };

  // Get API parameters
  const getApiParams = useMemo(() => {
    return () => {
      const params: any = {
        page: state.page,
        limit: state.limit,
      };

      if (state.search.trim()) {
        params.search = state.search.trim();
      }

      if (state.status !== 'all') {
        params.status = state.status;
      }

      if (state.sortBy) {
        params.sortBy = state.sortBy;
        params.sortOrder = state.sortOrder;
      }

      return params;
    };
  }, [state]);

  return {
    // Pagination
    page: state.page,
    limit: state.limit,
    setPage,
    setLimit,

    // Search and filtering
    search: state.search,
    status: state.status,
    setSearch,
    setStatus,

    // Sorting
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    setSorting,

    // View mode
    viewMode: state.viewMode,
    setViewMode,

    // Advanced filters
    filters: state.filters,
    setFilter,

    // Utility functions
    reset,
    hasChanges,

    // API parameters
    getApiParams,
  };
}
