import { AuthTokens } from '@/store/slices/userSlice';

export const TOKEN_KEY = 'auth_tokens';
export const USER_KEY = 'user';

// Token validation
export const isTokenValid = (token: string): boolean => {
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

// Get token expiration time
export const getTokenExpiration = (token: string): number | null => {
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
};

// Check if token needs refresh (refresh 5 minutes before expiry)
export const shouldRefreshToken = (token: string): boolean => {
  if (!token) return true;

  const expiration = getTokenExpiration(token);
  if (!expiration) return true;

  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
  return Date.now() + fiveMinutes >= expiration;
};

// Storage utilities
export const getStoredTokens = (): AuthTokens | null => {
  try {
    const tokens = localStorage.getItem(TOKEN_KEY);
    return tokens ? JSON.parse(tokens) : null;
  } catch (error) {
    console.error('Error getting stored tokens:', error);
    return null;
  }
};

export const setStoredTokens = (tokens: AuthTokens): void => {
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.error('Error setting stored tokens:', error);
  }
};

export const clearStoredTokens = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error clearing stored tokens:', error);
  }
};

export const getStoredUser = (): any => {
  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting stored user:', error);
    return null;
  }
};

export const setStoredUser = (user: any): void => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error setting stored user:', error);
  }
};
