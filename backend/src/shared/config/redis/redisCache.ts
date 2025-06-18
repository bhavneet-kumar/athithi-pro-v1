import { BaseRedisClient } from './baseRedisClient';

interface CacheOptions<T> {
  key: string;
  value?: T;
  ttl?: number;
  fetchFn?: () => Promise<T>;
  forceRefresh?: boolean;
}

export class RedisCache extends BaseRedisClient {
  async set(key: string, value: unknown, ttl?: number): Promise<string> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const client = this.getClient();
    return ttl ? client.set(key, serialized, 'EX', ttl) : client.set(key, serialized);
  }

  async get<T = unknown>(key: string, parseJson = true): Promise<T | null> {
    const value = await this.getClient().get(key);
    if (value === null) {
      return null;
    }
    return parseJson ? (this.safeJsonParse(value) as T) : (value as T);
  }

  async del(keys: string | string[]): Promise<number> {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    return this.getClient().del(...keyArray);
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.getClient().exists(key);
    return count > 0;
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.getClient().expire(key, seconds);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return this.getClient().ttl(key);
  }

  async cache<T>({ key, value, ttl, fetchFn, forceRefresh = false }: CacheOptions<T>): Promise<T | null> {
    if (!forceRefresh) {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    if (fetchFn && (!value || forceRefresh)) {
      value = await fetchFn();
    }

    if (value) {
      await this.set(key, value, ttl);
    }
    return value ?? null;
  }

  private safeJsonParse(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}
