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

  constructor(config: RedisConfig = {}) {
    this.cache = new RedisCache(config);
    this.pubsub = new RedisPubSub(config);
    this.streams = new RedisStreams(config);
    this.utility = new RedisUtility(config);
  }

  async connect(): Promise<void> {
    await Promise.all([this.cache.connect(), this.pubsub.connect(), this.streams.connect(), this.utility.connect()]);
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
