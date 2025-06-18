import { BaseRedisClient } from './baseRedisClient';

interface StreamEntry {
  [key: string]: string | number | boolean | object;
}

interface StreamData {
  id: string;
  data: Record<string, unknown>;
}

export class RedisStreams extends BaseRedisClient {
  async addStreamEntry(streamKey: string, entry: StreamEntry, id = '*'): Promise<string> {
    const args = this.prepareXAddArgs(streamKey, id, entry);
    return this.getClient().xadd(...args);
  }

  async readStream(streamKey: string, startId = '0-0', count?: number): Promise<StreamData[]> {
    const args: (string | number)[] = [streamKey, startId];
    if (count) args.push('COUNT', count);

    const entries = await this.getClient().xrange(...args);
    return entries.map(([id, data]) => ({
      id,
      data: this.parseStreamData(data),
    }));
  }

  async createConsumerGroup(streamKey: string, groupName: string, startId = '0-0', mkstream = false): Promise<boolean> {
    const args: (string | boolean)[] = ['CREATE', streamKey, groupName, startId];
    if (mkstream) args.push('MKSTREAM');
    await this.getClient().xgroup(...args);
    return true;
  }

  async readGroup(
    groupName: string,
    consumerName: string,
    streamKey: string,
    count = 10,
    blockMs = 5000,
    startId = '>',
  ): Promise<StreamData[]> {
    const result = await this.getClient().xreadgroup(
      'GROUP',
      groupName,
      consumerName,
      'COUNT',
      count,
      'BLOCK',
      blockMs,
      'STREAMS',
      streamKey,
      startId,
    );
    return (
      result?.[0]?.[1]?.map(([id, data]) => ({
        id,
        data: this.parseStreamData(data),
      })) || []
    );
  }

  async ackStreamEntries(streamKey: string, groupName: string, ids: string[]): Promise<number> {
    return this.getClient().xack(streamKey, groupName, ...ids);
  }

  private prepareXAddArgs(streamKey: string, id: string, entry: StreamEntry): (string | number)[] {
    const args: (string | number)[] = [streamKey, id];
    for (const [key, value] of Object.entries(entry)) {
      args.push(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
    return args;
  }

  private parseStreamData(data: string[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (let i = 0; i < data.length; i += 2) {
      const key = data[i];
      try {
        result[key] = JSON.parse(data[i + 1]);
      } catch {
        result[key] = data[i + 1];
      }
    }
    return result;
  }
}
