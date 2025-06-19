// import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

export const securityMiddleware = [
  helmet(),
  cors({
    origin: (origin, callback) => {
      callback(null, origin); // every origin allowed
    },
    credentials: true,
  }),
];
