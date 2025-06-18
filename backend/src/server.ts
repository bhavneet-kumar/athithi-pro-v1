import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import app from './app';
import { ApplicationServer } from './shared/core/application.server';
/**
 * Server startup file
 * Creates and starts the application server
 */
const startApplication = async (): Promise<void> => {
  try {
    const server = new ApplicationServer(app);
    await server.start();
  } catch (error) {
    console.error('Fatal error during server startup:', error);
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  }
};

// Start the application
startApplication();
