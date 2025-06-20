# Deep Linking System Documentation

## Overview

The deep linking system provides a comprehensive solution for managing URL-synchronized state throughout the project. It enables:

- **Deep-linkable URLs**: Every filter, pagination, and view state is reflected in the URL
- **Shareable links**: Users can share URLs that preserve their current view
- **Bookmarkable states**: Users can bookmark specific filtered views
- **Programmatic navigation**: Generate URLs with specific parameters
- **Browser back/forward support**: Full browser navigation support

## Architecture

The system consists of three main components:

1. **`useUrlState`** - Generic URL state management hook
2. **`useLeadsUrlState`** - Specialized hook for leads management
3. **`useDeepLink`** - Utility hook for generating deep-linkable URLs

## Core Hooks

### 1. useUrlState (Generic)

A generic hook for managing any state object with URL synchronization.

```typescript
import { useUrlState } from '@/hooks/useUrlState';

interface MyState {
  page: number;
  search: string;
  filters: {
    category: string;
    status: string;
  };
}

const { state, setState, setField, reset, hasChanges, getUrlParams } =
  useUrlState<MyState>({
    keyPrefix: 'my-feature',
    defaults: {
      page: 1,
      search: '',
      filters: {
        category: 'all',
        status: 'all',
      },
    },
    serializers: {
      serialize: state => ({
        page: state.page,
        search: state.search,
        category: state.filters.category,
        status: state.filters.status,
      }),
      deserialize: params => ({
        page: Number(params.page) || 1,
        search: String(params.search || ''),
        filters: {
          category: String(params.category || 'all'),
          status: String(params.status || 'all'),
        },
      }),
    },
    validate: state => state.page > 0 && state.page <= 1000,
  });
```

### 2. useLeadsUrlState (Specialized)

A specialized hook for leads management with built-in pagination, filtering, and sorting.

```typescript
import { useLeadsUrlState } from '@/hooks/useLeadsUrlState';

const {
  // Pagination
  page,
  limit,
  setPage,
  setLimit,

  // Search and filtering
  search,
  status,
  setSearch,
  setStatus,

  // Sorting
  sortBy,
  sortOrder,
  setSorting,

  // View mode
  viewMode,
  setViewMode,

  // Advanced filters
  filters,
  setFilter,

  // Utility functions
  reset,
  hasChanges,

  // API parameters
  getApiParams,
} = useLeadsUrlState();
```

### 3. useDeepLink (Utility)

A utility hook for generating deep-linkable URLs and sharing functionality.

```typescript
import { useDeepLink } from '@/hooks/useDeepLink';

const { generateUrl, generateShareableUrl, copyCurrentUrl, getCurrentUrl } =
  useDeepLink({
    basePath: '/crm/leads',
    urlStateConfig: leadsUrlState,
    additionalParams: { userId: 123 },
  });

// Generate URLs
const currentUrl = getCurrentUrl();
const newLeadsUrl = generateUrl({ status: 'new', page: 1 });
const shareableUrl = generateShareableUrl({ search: 'john' });

// Copy to clipboard
await copyCurrentUrl();
```

## Usage Examples

### Basic Leads Page Integration

```typescript
import { useLeadsUrlState } from '@/hooks/useLeadsUrlState';

const LeadsPage = () => {
  const {
    page,
    limit,
    search,
    status,
    setPage,
    setSearch,
    setStatus,
    getApiParams
  } = useLeadsUrlState();

  // Get API parameters
  const apiParams = getApiParams();

  // Fetch data
  const { data } = useLeadGetAllQuery(apiParams);

  return (
    <div>
      {/* Search input */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search leads..."
      />

      {/* Status tabs */}
      <button onClick={() => setStatus('new')}>New</button>
      <button onClick={() => setStatus('qualified')}>Qualified</button>

      {/* Pagination */}
      <button onClick={() => setPage(page - 1)}>Previous</button>
      <span>Page {page}</span>
      <button onClick={() => setPage(page + 1)}>Next</button>
    </div>
  );
};
```

### Creating Shareable Links

```typescript
import { useLeadsDeepLink } from '@/hooks/useDeepLink';

const ShareButton = () => {
  const { generateShareableUrl, copyCurrentUrl } = useLeadsDeepLink();

  const handleShare = async () => {
    const url = generateShareableUrl();

    if (navigator.share) {
      await navigator.share({
        title: 'Leads Dashboard',
        text: 'Check out these leads',
        url: url
      });
    } else {
      await copyCurrentUrl();
    }
  };

  return <button onClick={handleShare}>Share</button>;
};
```

### Programmatic Navigation

```typescript
import { useLeadsDeepLink } from '@/hooks/useDeepLink';

const NavigationButtons = () => {
  const { generateUrl } = useLeadsDeepLink();

  const navigateToNewLeads = () => {
    const url = generateUrl({ status: 'new', page: 1 });
    window.location.href = url;
  };

  const openQualifiedLeads = () => {
    const url = generateUrl({
      status: 'qualified',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    window.open(url, '_blank');
  };

  return (
    <div>
      <button onClick={navigateToNewLeads}>New Leads</button>
      <button onClick={openQualifiedLeads}>Qualified Leads</button>
    </div>
  );
};
```

### Custom Entity Implementation

```typescript
// For a new entity (e.g., customers)
interface CustomersUrlState {
  page: number;
  limit: number;
  search: string;
  category: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function useCustomersUrlState() {
  return useUrlState<CustomersUrlState>({
    keyPrefix: 'customers',
    defaults: {
      page: 1,
      limit: 10,
      search: '',
      category: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
    },
    serializers: {
      serialize: state => ({
        page: state.page,
        limit: state.limit,
        search: state.search,
        category: state.category,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
      deserialize: params => ({
        page: Number(params.page) || 1,
        limit: Number(params.limit) || 10,
        search: String(params.search || ''),
        category: String(params.category || 'all'),
        sortBy: String(params.sortBy || 'name'),
        sortOrder: String(params.sortOrder || 'asc') as 'asc' | 'desc',
      }),
    },
  });
}
```

## URL Structure

The system uses a prefix-based approach to organize URL parameters:

```
/crm/leads?leads.page=2&leads.limit=20&leads.search=john&leads.status=new&leads.sortBy=createdAt&leads.sortOrder=desc
```

This structure:

- Prevents parameter conflicts between different features
- Makes URLs readable and debuggable
- Allows for easy parameter extraction and manipulation

## Best Practices

### 1. Always Reset to Page 1 on Filter Changes

```typescript
const handleFilterChange = (filter: string) => {
  setFilter(filter);
  setPage(1); // Reset to first page
};
```

### 2. Validate State Before Serialization

```typescript
validate: state => {
  return (
    state.page > 0 &&
    state.limit > 0 &&
    state.limit <= 100 &&
    ['asc', 'desc'].includes(state.sortOrder)
  );
};
```

### 3. Provide Meaningful Defaults

```typescript
defaults: {
  page: 1,
  limit: 10,
  search: '',
  status: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc'
}
```

### 4. Handle Edge Cases in Deserialization

```typescript
deserialize: params => ({
  page: Number(params.page) || 1,
  limit: Number(params.limit) || 10,
  search: String(params.search || ''),
  status: String(params.status || 'all'),
});
```

### 5. Use TypeScript for Type Safety

```typescript
interface MyUrlState {
  page: number;
  search: string;
  filters: Record<string, string>;
}

const { state, setState } = useUrlState<MyUrlState>({...});
```

## Migration Guide

### From Local State to URL State

**Before:**

```typescript
const [page, setPage] = useState(1);
const [search, setSearch] = useState('');
const [status, setStatus] = useState('all');
```

**After:**

```typescript
const { page, search, status, setPage, setSearch, setStatus } =
  useLeadsUrlState();
```

### From Manual URL Building to Deep Links

**Before:**

```typescript
const url = `/leads?page=${page}&search=${search}&status=${status}`;
```

**After:**

```typescript
const { generateUrl } = useLeadsDeepLink();
const url = generateUrl({ page, search, status });
```

## Troubleshooting

### Common Issues

1. **URL parameters not updating**: Ensure you're using the setter functions from the hook
2. **Type errors**: Check that your state interface matches the serializers
3. **Navigation not working**: Verify that TanStack Router is properly configured
4. **Parameters not persisting**: Check that the keyPrefix is unique and consistent

### Debug Mode

Enable debug logging by adding console logs to your serializers:

```typescript
serializers: {
  serialize: (state) => {
    console.log('Serializing state:', state);
    return { /* ... */ };
  },
  deserialize: (params) => {
    console.log('Deserializing params:', params);
    return { /* ... */ };
  }
}
```

## Performance Considerations

1. **Memoization**: The hooks use `useMemo` and `useCallback` for optimal performance
2. **Debouncing**: Consider debouncing search inputs to avoid excessive URL updates
3. **Batch Updates**: Use `setState` with partial objects for multiple field updates
4. **Validation**: Keep validation functions lightweight to avoid performance impact

## Future Enhancements

1. **URL compression**: Implement URL shortening for complex states
2. **State persistence**: Add localStorage backup for offline scenarios
3. **Analytics integration**: Track URL state changes for user behavior analysis
4. **Advanced sharing**: Add QR code generation and social media sharing
