import http from 'http';

import { Application } from 'express';

import { connectDB, closeDB } from '../config/db';
import { InternalServerError } from '../utils/CustomError';

// ApplicationServer handles server lifecycle and graceful shutdown
export class ApplicationServer {
  private server: http.Server | null = null;
  private readonly port: number;
  private readonly timeout: number;
  private isShuttingDown = false;
  private readonly app: Application;

  constructor(app: Application, port?: string) {
    this.app = app;
    this.port = this.parsePort(port || process.env.PORT || '3000');
    this.timeout = parseInt(process.env.SERVER_TIMEOUT || '60000', 10);
    this.setupProcessHandlers();
  }

  // Parse and validate port number
  private parsePort(portString: string): number {
    const port = parseInt(portString, 10);
    if (isNaN(port) || port <= 0 || port > 65535) {
      throw new InternalServerError(`Invalid port number: ${portString}`);
    }
    return port;
  }

  // Setup process event handlers for shutdown and errors
  private setupProcessHandlers(): void {
    process.on('SIGINT', () => this.handleShutdown('SIGINT (Ctrl+C)', null));
    process.on('SIGTERM', () => this.handleShutdown('SIGTERM', null));
    process.on('unhandledRejection', (err: unknown) => {
      console.error('Unhandled Promise Rejection:', err);
      this.handleShutdown('UNHANDLED REJECTION', err);
    });
    process.on('uncaughtException', (err: unknown) => {
      console.error('Uncaught Exception:', err);
      this.handleShutdown('UNCAUGHT EXCEPTION', err);
    });
  }

  // Start the server
  async start(): Promise<void> {
    try {
      console.log('Starting server initialization...');
      await this.connectDatabase();
      this.createServer();
      await this.startListening();
      console.log(`Server successfully started on port ${this.port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Server timeout: ${this.timeout}ms`);
      console.log(`API Documentation: http://localhost:${this.port}/api-docs`);
    } catch (error) {
      console.error('Failed to start server:', error);
      await this.handleShutdown('STARTUP_ERROR', error);
    }
  }

  // Connect to database
  private async connectDatabase(): Promise<void> {
    try {
      console.log('Connecting to database...');
      await connectDB();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw new InternalServerError('Failed to connect to database');
    }
  }

  // Create HTTP server and setup error handlers
  private createServer(): void {
    try {
      this.server = http.createServer(this.app);
      this.server.setTimeout(this.timeout);
      this.server.on('error', (error: NodeJS.ErrnoException) => {
        this.handleServerError(error);
      });
      this.server.on('clientError', (error: Error, socket: any) => {
        console.error('Client Error:', error.message);
        if (!socket.destroyed) {
          socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        }
      });
      this.server.on('timeout', (socket: any) => {
        console.warn('Server timeout on socket');
        if (!socket.destroyed) {
          socket.end('HTTP/1.1 408 Request Timeout\r\n\r\n');
        }
      });
    } catch (error) {
      throw new InternalServerError('Failed to create HTTP server');
    }
  }

  // Start server listening
  private async startListening(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        reject(new InternalServerError('Server not created'));
        return;
      }
      this.server.listen(this.port, () => {
        console.log(`Server listening on port ${this.port}`);
        resolve();
      });
      this.server.on('error', reject);
    });
  }

  // Handle server-specific errors
  private handleServerError(error: NodeJS.ErrnoException): void {
    if (error.syscall !== 'listen') {
      throw error;
    }
    const bind = typeof this.port === 'string' ? 'Pipe ' + this.port : 'Port ' + this.port;
    switch (error.code) {
      case 'EACCES':
        console.error(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(`${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  // Handle graceful shutdown
  private async handleShutdown(reason: string, error: unknown): Promise<void> {
    if (this.isShuttingDown) {
      console.log('Shutdown already in progress...');
      return;
    }
    this.isShuttingDown = true;
    console.log(`Initiating graceful shutdown: ${reason}`);
    if (error) {
      console.error('Error details:', error);
    }
    const shutdownTimeout = setTimeout(() => {
      console.error('Graceful shutdown timeout, forcing exit...');
      process.exit(1);
    }, 10000);
    try {
      if (this.server) {
        console.log('Closing HTTP server...');
        await this.closeServer();
        console.log('HTTP server closed');
      }
      console.log('Closing database connection...');
      await closeDB();
      console.log('Database connection closed');
      clearTimeout(shutdownTimeout);
      console.log('Graceful shutdown completed');
      process.exit(error ? 1 : 0);
    } catch (shutdownError) {
      console.error('Error during shutdown:', shutdownError);
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  }

  // Close HTTP server
  private async closeServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  // Get server instance
  getServer(): http.Server | null {
    return this.server;
  }

  // Get port number
  getPort(): number {
    return this.port;
  }

  // Check if server is shutting down
  isShuttingDownStatus(): boolean {
    return this.isShuttingDown;
  }
}
