import { leadStreamsService } from './leadStreams.service';

/**
 * Initialize the lead import streams processor
 * This should be called when the application starts
 */
export const initializeLeadStreamsProcessor = async (): Promise<void> => {
  try {
    console.log('Initializing lead import streams processor...');
    await leadStreamsService.startProcessing();
    console.log('Lead import streams processor initialized successfully');
  } catch (error) {
    console.error('Failed to initialize lead import streams processor:', error);
    throw error;
  }
};

/**
 * Graceful shutdown for the streams processor
 */
export const shutdownLeadStreamsProcessor = async (): Promise<void> => {
  try {
    console.log('Shutting down lead import streams processor...');
    await leadStreamsService.stopProcessing();
    console.log('Lead import streams processor shutdown complete');
  } catch (error) {
    console.error('Error during lead streams processor shutdown:', error);
  }
};
