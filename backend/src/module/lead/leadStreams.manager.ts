import { cpus } from 'node:os';
import path from 'node:path';
import { Worker } from 'node:worker_threads';

const WORKER_CREATION_DELAY = 100;
const WORKER_SHUTDOWN_TIMEOUT = 5000;

export class LeadStreamsManager {
  private workers: Worker[] = [];
  private workerPath: string;
  private readonly poolSize: number;

  constructor(poolSize?: number) {
    // Resolve the worker file path
    // eslint-disable-next-line unicorn/prefer-module
    this.workerPath = path.resolve(__dirname, 'leadStreams.worker.ts');
    // Use provided pool size or default to CPU cores - 1 (leaving one core for main thread)
    this.poolSize = poolSize || Math.max(1, cpus().length - 1);
  }

  async startWorkers(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const redisConfig = {
          connection: process.env.REDIS_URL || 'redis://localhost:6379',
        };

        // Create worker pool
        // eslint-disable-next-line unicorn/no-new-array
        this.workers = new Array(this.poolSize).fill(null).map((_, index) => {
          const worker = new Worker(this.workerPath, {
            execArgv: ['-r', 'ts-node/register'],
            workerData: {
              redisConfig,
              workerId: index + 1, // Give each worker an ID
            },
          });

          worker.on('message', (message) => {
            if (message === 'worker_stopped') {
              console.log(`Worker ${index + 1} stopped gracefully`);
            }
          });

          worker.on('error', (error) => {
            console.error(`Worker ${index + 1} error:`, error);
            // Don't reject here - other workers may still be functioning
          });

          worker.on('exit', (code) => {
            if (code !== 0) {
              console.error(`Worker ${index + 1} stopped with exit code ${code}`);
            }
          });

          console.log(`Worker ${index + 1} started`);
          return worker;
        });

        // Give workers a moment to initialize
        setTimeout(resolve, WORKER_CREATION_DELAY);
      } catch (error) {
        console.error('Failed to start workers:', error);
        reject(error);
      }
    });
  }

  async stopWorkers(): Promise<void> {
    if (this.workers.length === 0) {
      return;
    }

    // Send shutdown signal to all workers
    const stopPromises = this.workers.map(
      (worker) =>
        new Promise<void>((resolve) => {
          worker.postMessage('shutdown', []);
          worker.on('exit', () => resolve());
        }),
    );

    await Promise.race([
      Promise.all(stopPromises),
      new Promise((resolve) => setTimeout(resolve, WORKER_SHUTDOWN_TIMEOUT)),
    ]);

    this.workers = [];
  }

  getWorkerCount(): number {
    return this.workers.length;
  }
}

// Export a singleton instance with pool size based on CPU cores
export const leadStreamsManager = new LeadStreamsManager(1);
