import { useCallback, useMemo } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';

export interface UrlStateConfig<T> {
  /**
   * The key prefix for URL parameters (e.g., 'leads' for leads?page=1&limit=10)
   */
  keyPrefix: string;

  /**
   * Default values for the state
   */
  defaults: T;

  /**
   * Serialization functions for converting state to/from URL parameters
   */
  serializers: {
    /**
     * Convert state object to URL search params
     */
    serialize: (state: T) => Record<string, string | number | boolean>;

    /**
     * Convert URL search params back to state object
     */
    deserialize: (params: Record<string, string | number | boolean>) => T;
  };

  /**
   * Optional validation function
   */
  validate?: (state: T) => boolean;

  /**
   * Whether to replace the current URL instead of pushing a new one
   */
  replace?: boolean;
}

export interface UseUrlStateReturn<T> {
  /**
   * Current state synchronized with URL
   */
  state: T;

  /**
   * Update state and sync with URL
   */
  setState: (newState: Partial<T> | ((prev: T) => T)) => void;

  /**
   * Reset state to defaults
   */
  reset: () => void;

  /**
   * Update a single field
   */
  setField: <K extends keyof T>(key: K, value: T[K]) => void;

  /**
   * Get URL parameters for the current state
   */
  getUrlParams: () => Record<string, string | number | boolean>;

  /**
   * Whether the current state differs from defaults
   */
  hasChanges: boolean;
}

/**
 * A generic hook for managing URL-synchronized state with TanStack Router.
 *
 * This hook automatically syncs any state object with URL search parameters,
 * making it perfect for pagination, filters, sorting, and any other state
 * that should be deep-linkable.
 *
 * @example
 * ```tsx
 * // Define your state type
 * interface LeadsState {
 *   page: number;
 *   limit: number;
 *   search: string;
 *   status: string;
 *   sortBy: string;
 *   sortOrder: 'asc' | 'desc';
 * }
 *
 * // Use the hook
 * const {
 *   state,
 *   setState,
 *   setField,
 *   reset,
 *   hasChanges
 * } = useUrlState<LeadsState>({
 *   keyPrefix: 'leads',
 *   defaults: {
 *     page: 1,
 *     limit: 10,
 *     search: '',
 *     status: 'all',
 *     sortBy: 'createdAt',
 *     sortOrder: 'desc'
 *   },
 *   serializers: {
 *     serialize: (state) => ({
 *       page: state.page,
 *       limit: state.limit,
 *       search: state.search,
 *       status: state.status,
 *       sortBy: state.sortBy,
 *       sortOrder: state.sortOrder
 *     }),
 *     deserialize: (params) => ({
 *       page: Number(params.page) || 1,
 *       limit: Number(params.limit) || 10,
 *       search: String(params.search || ''),
 *       status: String(params.status || 'all'),
 *       sortBy: String(params.sortBy || 'createdAt'),
 *       sortOrder: String(params.sortOrder || 'desc') as 'asc' | 'desc'
 *     })
 *   }
 * });
 *
 * // Update state - automatically syncs with URL
 * setField('page', 2);
 * setState({ search: 'john', page: 1 });
 * ```
 */
export function useUrlState<T extends Record<string, any>>(
  config: UrlStateConfig<T>
): UseUrlStateReturn<T> {
  const navigate = useNavigate();

  // Get search parameters from URL
  const search = useSearch({ strict: false });

  // Extract URL parameters for our key prefix
  const urlParams = useMemo(() => {
    const params: Record<string, string | number | boolean> = {};
    const prefix = config.keyPrefix;

    Object.entries(search).forEach(([key, value]) => {
      if (key.startsWith(prefix)) {
        const cleanKey = key.replace(`${prefix}.`, '');
        params[cleanKey] = value as string | number | boolean;
      }
    });

    return params;
  }, [search, config.keyPrefix]);

  // Deserialize URL params to state
  const state = useMemo(() => {
    try {
      const deserialized = config.serializers.deserialize(urlParams);
      const finalState = { ...config.defaults, ...deserialized };

      return finalState;
    } catch (error) {
      console.warn('Failed to deserialize URL params:', error);
      return config.defaults;
    }
  }, [urlParams, config.serializers, config.defaults]);

  // Check if state has changes from defaults
  const hasChanges = useMemo(() => {
    return Object.keys(config.defaults).some(key => {
      return state[key] !== config.defaults[key];
    });
  }, [state, config.defaults]);

  // Update URL with new state
  const updateUrl = useCallback(
    (newState: T) => {
      const serialized = config.serializers.serialize(newState);
      const prefix = config.keyPrefix;

      // Build new search params
      const newSearch = { ...search };

      // Remove old params with our prefix
      Object.keys(newSearch).forEach(key => {
        if (key.startsWith(prefix)) {
          delete newSearch[key];
        }
      });

      // Add new params
      Object.entries(serialized).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          newSearch[`${prefix}.${key}`] = value;
        }
      });

      // Navigate to new URL
      navigate({
        search: newSearch,
        replace: config.replace ?? false,
      });
    },
    [navigate, search, config.keyPrefix, config.serializers, config.replace]
  );

  // Set state function
  const setState = useCallback(
    (newState: Partial<T> | ((prev: T) => T)) => {
      const updatedState =
        typeof newState === 'function'
          ? newState(state)
          : { ...state, ...newState };

      // Validate if validation function is provided
      if (config.validate && !config.validate(updatedState)) {
        return;
      }

      updateUrl(updatedState);
    },
    [state, updateUrl, config.validate]
  );

  // Set single field
  const setField = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setState({ [key]: value } as unknown as Partial<T>);
    },
    [setState, state]
  );

  // Reset to defaults
  const reset = useCallback(() => {
    updateUrl(config.defaults);
  }, [updateUrl, config.defaults]);

  // Get URL parameters for current state
  const getUrlParams = useCallback(() => {
    return config.serializers.serialize(state);
  }, [config.serializers, state]);

  return {
    state,
    setState,
    setField,
    reset,
    getUrlParams,
    hasChanges,
  };
}
