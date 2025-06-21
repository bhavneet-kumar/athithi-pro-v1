// src/shared/services/leadStreams.manager.ts

import path from 'node:path';
import { Worker } from 'node:worker_threads';

export class LeadStreamsManager {
  private worker: Worker | null = null;
  private workerPath: string;

  constructor() {
    // Resolve the worker file path
    // eslint-disable-next-line unicorn/prefer-module
    this.workerPath = path.resolve(__dirname, 'leadStreams.worker.ts');
  }

  async startWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Get Redis configuration from the main thread's singleton
        // Pass the connection string that the main thread uses
        const redisConfig = {
          connection: process.env.REDIS_URL || 'redis://localhost:6379',
        };

        // Create a new worker thread with shared Redis config
        this.worker = new Worker(this.workerPath, {
          execArgv: ['-r', 'ts-node/register'],
          workerData: {
            redisConfig, // Pass config instead of creating new connections
          },
        });

        console.log('Lead streams worker started with shared Redis config');

        this.worker.on('message', (message) => {
          if (message === 'worker_stopped') {
            console.log('Worker stopped gracefully');
          }
        });

        this.worker.on('error', (error) => {
          console.error('Worker error:', error);
          reject(error);
        });

        this.worker.on('exit', (code) => {
          if (code !== 0) {
            console.error(`Worker stopped with exit code ${code}`);
          }
        });

        resolve();
      } catch (error) {
        console.error('Failed to start worker:', error);
        reject(error);
      }
    });
  }

  async stopWorker(): Promise<void> {
    if (!this.worker) {
      return;
    }

    return new Promise((resolve) => {
      // Send shutdown signal to worker
      this.worker?.postMessage('shutdown');

      this.worker?.on('exit', () => {
        this.worker = null;
        resolve();
      });
    });
  }
}

export const leadStreamsManager = new LeadStreamsManager();
