/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { parentPort, workerData } from 'node:worker_threads';

import { connectDB } from '../../shared/config/db';

import { LeadStreamsService, leadStreamsService } from './leadStreams.service';

class LeadStreamsWorker {
  private readonly leadStreamsServiceInstance: LeadStreamsService;
  private readonly workerId: number;

  constructor() {
    this.leadStreamsServiceInstance = leadStreamsService;
    this.workerId = workerData.workerId || 0;
    this.start();
  }

  async start() {
    try {
      console.log(`Worker ${this.workerId}: Connecting to database...`);
      await connectDB();
      console.log(`Worker ${this.workerId}: Database connected successfully`);

      // Start processing with this worker's instance
      await this.leadStreamsServiceInstance.startProcessing();

      // Handle shutdown signals
      if (parentPort) {
        parentPort.on('message', async (msg) => {
          if (msg === 'shutdown') {
            console.log(`Worker ${this.workerId}: Received shutdown signal`);
            await this.leadStreamsServiceInstance.stopProcessing();
            if (parentPort) {
              parentPort.postMessage('worker_stopped', []);
            }
            process.exit(0);
          }
        });
      }
    } catch (error) {
      console.error(`Worker ${this.workerId} error:`, error);
      process.exit(1);
    }
  }
}

// Start the worker
new LeadStreamsWorker();
