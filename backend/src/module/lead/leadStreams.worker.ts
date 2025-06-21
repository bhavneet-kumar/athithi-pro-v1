/* eslint-disable @typescript-eslint/explicit-function-return-type */
// src/shared/services/leadStreams.worker.ts

import { parentPort } from 'node:worker_threads';

import { connectDB } from '../../shared/config/db';

import { LeadStreamsService, leadStreamsService } from './leadStreams.service';

class LeadStreamsWorker {
  private readonly leadStreamsServiceInstance: LeadStreamsService;

  constructor() {
    this.leadStreamsServiceInstance = leadStreamsService;
    this.start();
  }

  async start() {
    try {
      // Connect to database first
      console.log('Worker: Connecting to database...');
      await connectDB();
      console.log('Worker: Database connected successfully');

      // Start processing
      await this.leadStreamsServiceInstance.startProcessing();

      // Handle shutdown signals
      if (parentPort) {
        parentPort.on('message', async (msg) => {
          if (msg === 'shutdown') {
            await this.leadStreamsServiceInstance.stopProcessing();
            if (parentPort) {
              parentPort.postMessage('worker_stopped', []);
            }
            process.exit(0);
          }
        });
      }
    } catch (error) {
      console.error('Worker error:', error);
      process.exit(1);
    }
  }
}

// Start the worker
new LeadStreamsWorker();
