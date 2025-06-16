import express from 'express';
import passport from 'passport';

import routes from './module/index';
import './shared/config/passport';
import { swaggerUi, swaggerDocument } from './shared/config/swagger';
import { successResponseMiddleware } from './shared/middlewares/customSuccess.middleware';
import { errorHandler } from './shared/middlewares/error.middleware';
import { requestLogger } from './shared/middlewares/requestLogger.middleware';
import { securityMiddleware } from './shared/middlewares/security.middleware';

const app = express();

const HTTP_NOT_FOUND = 404;

app.use(requestLogger);

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Security + JSON
app.use(securityMiddleware);
app.use(express.json());

// Initialize Passport
app.use(passport.initialize());

// Response middleware
app.use(successResponseMiddleware);

// Routes
app.use('/api/v1', routes);

// 404 Route
app.use((req, res) => {
  res.status(HTTP_NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

export default app;
// Test change
