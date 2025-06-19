import http from 'node:http';
import { Socket } from 'node:net';

import { Application } from 'express';

import { connectDB, closeDB } from '../config/db';
import { InternalServerError } from '../utils/customerrors';

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
    this.timeout = Number.parseInt(process.env.SERVER_TIMEOUT || '60000', 10);
    this.setupProcessHandlers();
  }

  // Parse and validate port number
  private parsePort(portString: string): number {
    const port = Number.parseInt(portString, 10);
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    if (Number.isNaN(port) || port <= 0 || port > 65_535) {
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
      this.server.on('clientError', (error: Error, socket: Socket) => {
        console.error('Client Error:', error.message);
        if (!socket.destroyed) {
          socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        }
      });
      this.server.on('timeout', (socket: Socket) => {
        console.warn('Server timeout on socket');
        if (!socket.destroyed) {
          socket.end('HTTP/1.1 408 Request Timeout\r\n\r\n');
        }
      });
    } catch {
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
    const bind = typeof this.port === 'string' ? `Pipe ${this.port}` : `Port ${this.port}`;
    switch (error.code) {
      case 'EACCES': {
        console.error(`${bind} requires elevated privileges`);
        throw new InternalServerError(`${bind} requires elevated privileges`);
      }
      case 'EADDRINUSE': {
        console.error(`${bind} is already in use`);
        throw new InternalServerError(`${bind} is already in use`);
      }
      default: {
        throw error;
      }
    }
  }

  // Handle graceful shutdown
  private async handleShutdown(reason: string, error: unknown): Promise<void> {
    if (this.isShuttingDown) {
      this.logShutdownInProgress();
      return;
    }
    this.isShuttingDown = true;
    this.logInitiateShutdown(reason, error);

    const SHUTDOWN_TIMEOUT_MS = 10_000;
    const shutdownTimeout = setTimeout(() => {
      this.logShutdownTimeout();
      throw new InternalServerError('Graceful shutdown timeout');
    }, SHUTDOWN_TIMEOUT_MS);

    try {
      await this.shutdownServer();
      await this.shutdownDatabase();
      clearTimeout(shutdownTimeout);
      this.logShutdownComplete();
      throw new InternalServerError('Graceful shutdown completed');
    } catch (shutdownError) {
      this.logShutdownError(shutdownError);
      clearTimeout(shutdownTimeout);
      throw new InternalServerError('Error during shutdown');
    }
  }

  private logShutdownInProgress(): void {
    console.log('Shutdown already in progress...');
  }

  private logInitiateShutdown(reason: string, error: unknown): void {
    console.log(`Initiating graceful shutdown: ${reason}`);
    if (error) {
      console.error('Error details:', error);
    }
  }

  private logShutdownTimeout(): void {
    console.error('Graceful shutdown timeout, forcing exit...');
  }

  private async shutdownServer(): Promise<void> {
    if (this.server) {
      console.log('Closing HTTP server...');
      await this.closeServer();
      console.log('HTTP server closed');
    }
  }

  private async shutdownDatabase(): Promise<void> {
    console.log('Closing database connection...');
    await closeDB();
    console.log('Database connection closed');
  }

  private logShutdownComplete(): void {
    console.log('Graceful shutdown completed');
  }

  private logShutdownError(shutdownError: unknown): void {
    console.error('Error during shutdown:', shutdownError);
  }

  // Close HTTP server
  private async closeServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }
      // eslint-disable-next-line promise/prefer-await-to-callbacks
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
