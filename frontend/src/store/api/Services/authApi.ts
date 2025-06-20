import { apiSlice } from '../apiSlice';
import { User, AuthTokens } from '../../slices/userSlice';

export interface AgencySettings {
  maxUsers: number;
  allowedDomains: string[];
  customBranding: {
    logo: string;
    colors: {
      primary: string;
      secondary: string;
    };
  };
}

export interface AgencyInfo {
  name: string;
  code: string;
  domain: string;
  settings: AgencySettings;
}

export interface RegisterForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  agency: AgencyInfo;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  code: number;
  status: string;
  message: string;
  data: {
    token: string;
    refreshToken: string;
    user: User;
  };
  timestamp: string;
  path: string;
}

export interface RefreshResponse {
  success: boolean;
  code: number;
  status: string;
  message: string;
  data: {
    token: string;
    refreshToken: string;
  };
  timestamp: string;
  path: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  code: number;
  status: string;
  message: string;
  data: null;
  timestamp: string;
  path: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: builder => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: credentials => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
        credentials: 'include',
      }),
      invalidatesTags: ['Auth'],
    }),
    register: builder.mutation<AuthResponse, RegisterForm>({
      query: credentials => ({
        url: 'auth/register',
        method: 'POST',
        body: credentials,
        credentials: 'include',
      }),
      invalidatesTags: ['Auth'],
    }),
    logout: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: 'auth/logout',
        method: 'POST',
        credentials: 'include',
      }),
      invalidatesTags: ['Auth'],
    }),
    refresh: builder.mutation<RefreshResponse, { refreshToken: string }>({
      query: ({ refreshToken }) => ({
        url: 'auth/refresh',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
        credentials: 'include',
      }),
    }),
    verifyEmail: builder.mutation<VerifyEmailResponse, { token: string }>({
      query: ({ token }) => ({
        url: `auth/verify-email/${token}`,
        method: 'GET',
        credentials: 'include',
      }),
      invalidatesTags: ['Auth'],
    }),
    forgotPassword: builder.mutation<{ success: boolean }, { email: string }>({
      query: ({ email }) => ({
        url: 'auth/forgot-password',
        method: 'POST',
        body: { email },
        credentials: 'include',
      }),
    }),
    resetPassword: builder.mutation<
      { success: boolean },
      { token: string; password: string; confirmPassword: string }
    >({
      query: ({ token, password, confirmPassword }) => ({
        url: `auth/reset-password/${token}`,
        method: 'POST',
        body: { password, confirmPassword },
        credentials: 'include',
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshMutation,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
