import Redis from 'ioredis';

import { BaseRedisClient } from './baseRedisClient';

export class RedisPubSub extends BaseRedisClient {
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;

  async publish(channel: string, message: unknown): Promise<number> {
    if (!this.publisher) {
      this.publisher = this.createClient();
    }
    const serialized = typeof message === 'string' ? message : JSON.stringify(message);
    return this.publisher.publish(channel, serialized);
  }

  async subscribe(
    channel: string,
    callback: (message: unknown, channel: string) => void,
  ): Promise<() => Promise<void>> {
    if (!this.subscriber) this.subscriber = this.createClient();

    this.subscriber.on('message', (msgChannel: string, message: string) => {
      if (channel === msgChannel) {
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
