import Redis from 'ioredis';

import { BaseRedisClient } from './baseRedisClient';

export class RedisPubSub extends BaseRedisClient {
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;

  async publish(channel: string, message: unknown): Promise<number> {
    if (!this.publisher) {
      if (this.config.isCluster) {
        throw new Error('Pub/Sub operations are not supported in cluster mode');
      }
      this.publisher = this.createClient() as Redis;
    }
    const serialized = typeof message === 'string' ? message : JSON.stringify(message);
    return this.publisher.publish(channel, serialized);
  }

  async subscribe(
    channel: string,
    // eslint-disable-next-line promise/prefer-await-to-callbacks
    callback: (message: unknown, channel: string) => void,
  ): Promise<() => Promise<void>> {
    if (!this.subscriber) {
      if (this.config.isCluster) {
        throw new Error('Pub/Sub operations are not supported in cluster mode');
      }
      this.subscriber = this.createClient() as Redis;
    }

    this.subscriber.on('message', (msgChannel: string, message: string) => {
      if (channel === msgChannel) {
        // eslint-disable-next-line promise/prefer-await-to-callbacks
        callback(this.safeJsonParse(message), msgChannel);
      }
    });

    await this.subscriber.subscribe(channel);
    return async () => {
      await this.unsubscribe(channel);
    };
  }

  async unsubscribe(channel: string): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.unsubscribe(channel);
    }
  }

  private safeJsonParse(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}
