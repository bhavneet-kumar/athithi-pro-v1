import { workerData } from 'node:worker_threads';

import { Types } from 'mongoose';

import { redisManager } from '../../shared/config/redis/redisManager';
import { Counter } from '../../shared/models/counter.model';
import { ILead, Lead } from '../../shared/models/lead.model';
import { aiScoreCalculator } from '../../shared/utils/aiScore';
import { InternalServerError } from '../../shared/utils/customError';
import { LEAD_NUMBER_PAD_LENGTH, LeadSource, LeadStatus } from '../../types/enum/lead';

import { ILeadImport } from './lead.interface';

interface ImportJob {
  batch: Record<string, unknown>[];
  progress: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
    errors: Array<{ index: number; error: string }>;
  };
  importId: string;
  agencyId: string;
  agencyCode: string;
  batchIndex: number;
  timestamp: string;
}

// Constants
const BATCH_SIZE = 50;
const BLOCK_TIMEOUT = 5000; // 5 seconds
const SHUTDOWN_TIMEOUT = 5000; // 5 seconds
const MESSAGE_READ_COUNT = 1; // read only one message at a time

export class LeadStreamsService {
  private readonly STREAM_KEY = 'lead:imports';
  private readonly GROUP_NAME = 'lead-import-processors';
  // private readonly CONSUMER_NAME = 'lead-import-consumer-1';
  private isShuttingDown = false;
  private processingPromise: Promise<void> | null = null;

  constructor() {
    this.initializeConsumerGroup();
  }

  // Modify the consumer name to include worker ID
  private getConsumerName(): string {
    const workerId = (workerData?.workerId || 'main').toString();
    return `lead-import-consumer-${workerId}`;
  }

  private async initializeConsumerGroup(): Promise<void> {
    try {
      await redisManager.streams.createConsumerGroup(this.STREAM_KEY, this.GROUP_NAME, '0-0', true);
    } catch (error) {
      // Group might already exist, which is fine
      console.log('Consumer group might already exist:', error.message);
    }
  }

  async queueImportJob(importData: ILeadImport, agencyId: string, agencyCode: string): Promise<string> {
    try {
      const jobId = importData.importId;
      const totalLeads = importData.leads.length;

      const jobIds: Record<number, string> = {};

      // Create batches and store them separately
      for (let i = 0; i < totalLeads; i += BATCH_SIZE) {
        const batch = importData.leads.slice(i, i + BATCH_SIZE);

        // push to stream
        const entry = await redisManager.streams.addStreamEntry(this.STREAM_KEY, {
          batch,
          agencyId,
          agencyCode,
          progress: {
            total: batch.length,
            processed: 0,
            successful: 0,
            failed: 0,
            errors: [],
          },
          importId: jobId,
          batchIndex: i,
          timestamp: Date.now().toString(),
        });

        jobIds[i as keyof typeof jobIds] = entry;
      }

      return jobId;
    } catch (error) {
      throw new InternalServerError(`Failed to queue import job: ${error.message}`);
    }
  }

  async processImportJobs(): Promise<void> {
    try {
      while (!this.isShuttingDown) {
        const entries = await redisManager.streams.readGroup(
          this.GROUP_NAME,
          this.getConsumerName(),
          this.STREAM_KEY,
          MESSAGE_READ_COUNT,
          BLOCK_TIMEOUT,
        );

        if (entries.length === 0) {
          continue;
        }

        console.log('entries', entries);

        for (const entry of entries) {
          try {
            console.log('entry', entry);
            const jobData = entry.data as unknown as ImportJob;
            console.log('jobData', jobData);
            await this.processImportJob(jobData);

            // Acknowledge the processed entry
            await redisManager.streams.ackStreamEntries(this.STREAM_KEY, this.GROUP_NAME, [entry.id]);
          } catch (error) {
            console.error('Error processing import job:', error);
            // Still acknowledge to avoid infinite retries
            await redisManager.streams.ackStreamEntries(this.STREAM_KEY, this.GROUP_NAME, [entry.id]);
          }
        }
      }
    } catch (error) {
      console.error('Error in import job processor:', error);
      throw new InternalServerError(`Import job processing failed: ${error.message}`);
    }
  }

  private async processImportJob(job: ImportJob): Promise<void> {
    await this.processLeadBatches(job);
  }

  private async processLeadBatches(job: ImportJob): Promise<void> {
    const { batch, agencyId, agencyCode, progress } = job;

    // as we already pushing the batch to stream, we can process it here
    const batchResults = await this.processLeadBatch(batch, agencyId, agencyCode);

    console.log('batchResults', batchResults);

    // update progress
    progress.processed += batch.length;
    progress.successful += batchResults.successful.length;
    progress.failed += batchResults.failed;
    progress.errors.push(...batchResults.errors);
  }

  private async processLeadBatch(
    leads: Record<string, unknown>[],
    agencyId: string,
    agencyCode: string,
  ): Promise<{
    successful: ILead[];
    failed: number;
    errors: Array<{ index: number; error: string }>;
  }> {
    const successful: ILead[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    try {
      // Prepare all leads for bulk insertion
      const leadsToInsert = await this.prepareLeadsForBulkInsertion(leads, agencyId, agencyCode);

      // Perform bulk insertion
      const insertedLeads = await Lead.insertMany(leadsToInsert, {
        ordered: false, // Continue processing even if some documents fail
        rawResult: false,
      });

      successful.push(...insertedLeads);
    } catch (error) {
      await this.handleBulkInsertionError(error, leads, successful, errors);
    }

    return {
      successful,
      failed: errors.length,
      errors,
    };
  }

  private async handleBulkInsertionError(
    error: {
      writeErrors?: Array<{ index: number; err?: { errmsg?: string } }>;
      insertedDocs?: ILead[];
      message?: string;
    },
    leads: Record<string, unknown>[],
    successful: ILead[],
    errors: Array<{ index: number; error: string }>,
  ): Promise<void> {
    // Handle bulk insertion errors
    if (error.writeErrors) {
      // Some documents failed during bulk insertion

      // Add successful ones
      if (error.insertedDocs) {
        successful.push(...error.insertedDocs);
      }

      // Add errors for failed ones
      for (const writeError of error.writeErrors) {
        errors.push({
          index: writeError.index,
          error: writeError.err?.errmsg || 'Bulk insertion failed',
        });
      }
    } else {
      // All documents failed
      for (let index = 0; index < leads.length; index++) {
        errors.push({
          index,
          error: error.message || 'Bulk insertion failed',
        });
      }
    }
  }

  private async prepareLeadsForBulkInsertion(
    leads: Record<string, unknown>[],
    agencyId: string,
    agencyCode: string,
  ): Promise<Partial<ILead>[]> {
    const currentYear = new Date().getFullYear();
    const counterName = `leadNumber_${agencyId}_${currentYear}`;

    // Get the current counter value
    const counter = await Counter.findOneAndUpdate(
      { name: counterName },
      { $inc: { value: leads.length } },
      { new: true, upsert: true },
    );
    const startValue = counter.value - leads.length + 1;

    return leads.map((leadData, index) =>
      this.createLeadDocument({
        leadData,
        agencyId,
        agencyCode,
        currentYear,
        counterValue: startValue + index,
      }),
    );
  }

  private createLeadDocument(params: {
    leadData: Record<string, unknown>;
    agencyId: string;
    agencyCode: string;
    currentYear: number;
    counterValue: number;
  }): Partial<ILead> {
    const { leadData, agencyId, agencyCode, currentYear, counterValue } = params;
    const leadNumber = `${agencyCode}-${currentYear}-${counterValue.toString().padStart(LEAD_NUMBER_PAD_LENGTH, '0')}`;

    const { fullName, email, phone, alternatePhone, status, source, priority, travelDetails, tags, notes } = leadData;

    const aiScore = Number(aiScoreCalculator.calculateScore(leadData as unknown as ILead));

    return {
      ...leadData,
      agencyId: new Types.ObjectId(agencyId),
      leadNumber,
      fullName: fullName as string,
      email: email as string,
      phone: phone as string,
      alternatePhone: alternatePhone as string,
      status: (status as LeadStatus) || LeadStatus.NEW,
      source: (source as LeadSource) || LeadSource.OTHER,
      priority: priority as string,
      travelDetails: travelDetails as ILead['travelDetails'],
      tags: tags as string[],
      notes: notes as string,
      aiScore: {
        value: aiScore,
        lastCalculated: new Date(),
      },
    };
  }

  async getImportStatus(importId: string): Promise<ImportJob | null> {
    try {
      console.log('importId', importId);
      return null;
    } catch (error) {
      console.error('Error getting import status:', error);
      return null;
    }
  }

  async startProcessing(): Promise<void> {
    console.log('Starting lead import processor...');
    try {
      this.isShuttingDown = false;
      this.processingPromise = this.processImportJobs();
      await this.processingPromise;
    } catch (error) {
      console.error('Lead import processor failed:', error);
    }
  }

  async stopProcessing(): Promise<void> {
    console.log('Stopping lead import processor...');
    this.isShuttingDown = true;

    if (this.processingPromise) {
      try {
        // Wait for the current processing to complete
        await Promise.race([
          this.processingPromise,
          new Promise((resolve) => setTimeout(resolve, SHUTDOWN_TIMEOUT)), // 5 second timeout
        ]);
      } catch (error) {
        console.error('Error waiting for processor to stop:', error);
      }
    }

    console.log('Lead import processor stopped');
  }
}

export const leadStreamsService = new LeadStreamsService();
