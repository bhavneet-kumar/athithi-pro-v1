import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
}

export interface UserState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const getInitialState = (): UserState => {
  // Try to get tokens from localStorage
  const storedTokens = localStorage.getItem('auth_tokens');
  const storedUser = localStorage.getItem('user');

  let tokens: AuthTokens | null = null;
  let user: User | null = null;

  if (storedTokens) {
    try {
      tokens = JSON.parse(storedTokens);
    } catch (error) {
      console.error('Failed to parse stored tokens:', error);
      localStorage.removeItem('auth_tokens');
    }
  }

  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch (error) {
      console.error('Failed to parse stored user:', error);
      localStorage.removeItem('user');
    }
  }

  return {
    user,
    tokens,
    isAuthenticated: !!(tokens?.token && user),
    isLoading: false,
  };
};

const userSlice = createSlice({
  name: 'user',
  initialState: getInitialState(),
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; tokens: AuthTokens }>
    ) => {
      const { user, tokens } = action.payload;
      state.user = user;
      state.tokens = tokens;
      state.isAuthenticated = true;
      state.isLoading = false;

      // Store in localStorage
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));
      localStorage.setItem('user', JSON.stringify(user));
    },
    setTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.tokens = action.payload;
      localStorage.setItem('auth_tokens', JSON.stringify(action.payload));
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    logout: state => {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.isLoading = false;

      // Clear localStorage
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('user');
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    initializeFromStorage: state => {
      const storedTokens = localStorage.getItem('auth_tokens');
      const storedUser = localStorage.getItem('user');

      if (storedTokens && storedUser) {
        try {
          const tokens = JSON.parse(storedTokens);
          const user = JSON.parse(storedUser);
          state.tokens = tokens;
          state.user = user;
          state.isAuthenticated = true;
        } catch (error) {
          console.error('Failed to initialize from storage:', error);
          localStorage.removeItem('auth_tokens');
          localStorage.removeItem('user');
        }
      }
    },
  },
});

export const {
  setCredentials,
  setTokens,
  setUser,
  setLoading,
  logout,
  updateUser,
  initializeFromStorage,
} = userSlice.actions;

export default userSlice.reducer;
