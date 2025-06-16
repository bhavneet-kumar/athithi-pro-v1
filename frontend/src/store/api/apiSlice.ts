import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Define a base API slice
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    prepareHeaders: headers => {
      return headers;
    },
  }),
  tagTypes: [],
  endpoints: () => ({
    // Base endpoints can be added here if needed
  }),
  // Add default error handling
  // refetchOnMountOrArgChange: true,
  // refetchOnFocus: true,
  refetchOnReconnect: true,
});
