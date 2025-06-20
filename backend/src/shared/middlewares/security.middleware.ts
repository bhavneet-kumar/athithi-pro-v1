// import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

export const securityMiddleware = [
  helmet(),
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://athitipro.aionos.co',
  }),
];
