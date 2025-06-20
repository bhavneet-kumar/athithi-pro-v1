import { config } from '..';

import { RedisConfig } from './baseRedisClient';
import { RedisCache } from './redisCache';
import { RedisPubSub } from './redisPubSub';
import { RedisStreams } from './redisStreams';
import { RedisUtility } from './redisUtility';

export class RedisManager {
  public readonly cache: RedisCache;
  public readonly pubsub: RedisPubSub;
  public readonly streams: RedisStreams;
  public readonly utility: RedisUtility;

  constructor(configs: RedisConfig = {}) {
    this.cache = new RedisCache(configs);
    this.pubsub = new RedisPubSub(configs);
    this.streams = new RedisStreams(configs);
    this.utility = new RedisUtility(configs);
  }

  async connect(): Promise<void> {
    // ioredis auto-connects, so this is mainly for initialization
    await Promise.all([this.cache.connect(), this.streams.connect(), this.utility.connect(), this.pubsub.connect()]);
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.cache.disconnect(),
      this.pubsub.disconnect(),
      this.streams.disconnect(),
      this.utility.disconnect(),
    ]);
  }
}

export const redisManager = new RedisManager({
  connection: config.redis.url,
});
