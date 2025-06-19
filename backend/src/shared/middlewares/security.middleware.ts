// import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

export const securityMiddleware = [
  helmet(),
  cors({
    origin: true, // allow all origins
    credentials: true,
  }),
];
