import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  setLoading,
  initializeFromStorage,
  setCredentials,
} from '@/store/slices/userSlice';
import { getStoredTokens, getStoredUser, isTokenValid } from '@/lib/tokenUtils';
import { useCurrentUserQuery } from '@/store/api/Services/authApi';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const dispatch = useDispatch();

  // Check if we have valid stored tokens
  const storedTokens = getStoredTokens();
  const storedUser = getStoredUser();
  const hasValidToken = storedTokens?.token && isTokenValid(storedTokens.token);

  // Query current user if we have valid tokens
  const {
    data: userData,
    isLoading: isUserLoading,
    error: userError,
    isSuccess: isUserSuccess,
  } = useCurrentUserQuery(undefined, {
    skip: !hasValidToken,
  });

  useEffect(() => {
    // Initialize from localStorage first
    dispatch(initializeFromStorage());

    // Set loading state
    dispatch(setLoading(true));

    // If no valid tokens, stop loading immediately
    if (!hasValidToken) {
      dispatch(setLoading(false));
      return;
    }

    // If we have valid tokens but no stored user, try to get user data
    if (hasValidToken && !storedUser) {
      // User query will handle this
      return;
    }

    // If user query fails, clear auth state
    if (userError) {
      dispatch(setLoading(false));
      // Clear stored data if the user query fails
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('user');
      return;
    }

    // If user query is successful and we have user data, update store
    if (isUserSuccess && userData && storedTokens) {
      // Update with fresh data from API
      dispatch(
        setCredentials({
          user: userData,
          tokens: storedTokens,
        })
      );
      dispatch(setLoading(false));
      return;
    }

    // If user query is still loading, keep loading state
    if (isUserLoading) {
      return;
    }

    // If we have stored user and tokens, set credentials
    if (storedUser && storedTokens) {
      dispatch(
        setCredentials({
          user: storedUser,
          tokens: storedTokens,
        })
      );
    }

    dispatch(setLoading(false));
  }, [
    dispatch,
    hasValidToken,
    storedUser,
    storedTokens,
    userData,
    isUserLoading,
    userError,
    isUserSuccess,
  ]);

  return <>{children}</>;
};
