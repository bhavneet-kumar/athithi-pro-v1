import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

import { getRedisClient } from '../config/db';
import {
  LOGIN_RATE_LIMITER_TIME,
  PASSWORD_RESET_RATE_LIMITER_TIME,
  SIGNUP_RATE_LIMITER_TIME,
} from '../constant/timeValues';

const redis = getRedisClient();

// Signup rate limiter: 5 attempts per hour per IP
export const signupLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (command: string, ...args: string[]): Promise<number> =>
      redis.call(command, ...args) as Promise<number>,
    prefix: 'signup_limit:',
  }),
  windowMs: SIGNUP_RATE_LIMITER_TIME, // 1 hour
  max: 5, // 5 attempts
  message: 'Too many signup attempts from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

// Login rate limiter: 5 attempts per 15 minutes per IP
export const loginLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (command: string, ...args: string[]): Promise<number> =>
      redis.call(command, ...args) as Promise<number>,
    prefix: 'login_limit:',
  }),
  windowMs: LOGIN_RATE_LIMITER_TIME, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset rate limiter: 3 attempts per hour per IP
export const passwordResetLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (command: string, ...args: string[]): Promise<number> =>
      redis.call(command, ...args) as Promise<number>,
    prefix: 'password_reset_limit:',
  }),
  windowMs: PASSWORD_RESET_RATE_LIMITER_TIME, // 1 hour
  max: 3, // 3 attempts
  message: 'Too many password reset attempts, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});
