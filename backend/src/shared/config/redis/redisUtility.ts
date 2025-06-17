import { BaseRedisClient } from './baseRedisClient';

export class RedisUtility extends BaseRedisClient {
  async scanKeys(pattern = '*', count = 100): Promise<string[]> {
    let cursor = '0';
    const keys: string[] = [];
    do {
      const [nextCursor, batch] = await this.getClient().scan(cursor, 'MATCH', pattern, 'COUNT', count);
      keys.push(...batch);
      cursor = nextCursor;
    } while (cursor !== '0');
    return keys;
  }

  async deleteByPattern(pattern: string, batchSize = 100): Promise<number> {
    const keys = await this.scanKeys(pattern, batchSize);
    return keys.length > 0 ? this.getClient().del(...keys) : 0;
  }

  async flush(all = false): Promise<boolean> {
    await this.getClient()[all ? 'flushall' : 'flushdb']();
    return true;
  }

  async info(section?: string): Promise<Record<string, string>> {
    const infoStr = await this.getClient().info(section);
    const result: Record<string, string> = {};
    infoStr.split('\r\n').forEach((line) => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) result[key] = value;
      }
    });
    return result;
  }
}
