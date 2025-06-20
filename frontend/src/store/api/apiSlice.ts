import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { RootState } from '../index';
import { logout, setTokens } from '../slices/userSlice';
import {
  getStoredTokens,
  setStoredTokens,
  clearStoredTokens,
  shouldRefreshToken,
} from '@/lib/tokenUtils';

// Custom base query with token management
const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:3000/api/v1/',
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const tokens = state.user.tokens || getStoredTokens();

    if (tokens?.token) {
      headers.set('authorization', `Bearer ${tokens.token}`);
    }

    return headers;
  },
  credentials: 'include',
});

// Refresh token function
const refreshToken = async (refreshToken: string) => {
  const response = await fetch('http://localhost:3000/api/v1/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${refreshToken}`,
    },
    credentials: 'include',
  });

  if (response.ok) {
    const data = await response.json();
    return data;
  }
  throw new Error('Failed to refresh token');
};

// Custom base query with refresh logic
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Token expired, try to refresh
    const state = api.getState() as RootState;
    const tokens = state.user.tokens || getStoredTokens();

    if (tokens?.refreshToken) {
      try {
        const refreshResult = await refreshToken(tokens.refreshToken);

        if (refreshResult.success && refreshResult.data) {
          // Update tokens in store and localStorage
          const newTokens = {
            token: refreshResult.data.token,
            refreshToken: refreshResult.data.refreshToken,
          };

          api.dispatch(setTokens(newTokens));
          setStoredTokens(newTokens);

          // Retry the original request
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Refresh failed, logout user
          api.dispatch(logout());
          clearStoredTokens();
        }
      } catch (error) {
        // Refresh failed, logout user
        api.dispatch(logout());
        clearStoredTokens();
      }
    } else {
      // No refresh token, logout user
      api.dispatch(logout());
      clearStoredTokens();
    }
  }

  return result;
};

// Define a base API slice
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Auth', 'Leads'],
  endpoints: () => ({
    // Base endpoints can be added here if needed
  }),
  refetchOnReconnect: true,
});
