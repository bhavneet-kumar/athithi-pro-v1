import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import {
  logout,
  setCredentials,
  setTokens,
  setUser,
  updateUser,
} from '@/store/slices/userSlice';
import {
  useLogoutMutation,
  useRefreshMutation,
} from '@/store/api/Services/authApi';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { clearStoredTokens } from '@/lib/tokenUtils';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, tokens, isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.user
  );
  const [logoutMutation] = useLogoutMutation();
  const [refreshMutation] = useRefreshMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      dispatch(logout());
      clearStoredTokens();
      toast.success('Logged out successfully');
      navigate({ to: '/login' });
    }
  };

  const handleRefreshToken = async () => {
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await refreshMutation({
        refreshToken: tokens.refreshToken,
      }).unwrap();

      if (response.success && response.data) {
        dispatch(
          setTokens({
            token: response.data.token,
            refreshToken: response.data.refreshToken,
          })
        );
        return response.data;
      }
      throw new Error('Failed to refresh token');
    } catch (error) {
      console.error('Token refresh failed:', error);
      handleLogout();
      throw error;
    }
  };

  const updateUserProfile = (userData: Partial<typeof user>) => {
    if (user) {
      dispatch(updateUser(userData));
    }
  };

  return {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    logout: handleLogout,
    refreshToken: handleRefreshToken,
    updateUser: updateUserProfile,
  };
};
