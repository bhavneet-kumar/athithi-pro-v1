import Redis, { Cluster, RedisOptions } from 'ioredis';

const DEFAULT_PORT = 6379;
const DEFAULT_HOST = 'localhost';
const DEFAULT_DB = 0;

export interface RedisConfig {
  connection?: string | object;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  isCluster?: boolean;
  nodes?: Array<{ host: string; port: number }>;
  options?: Partial<RedisOptions>;
}

export class BaseRedisClient {
  protected readonly config: RedisConfig;
  protected client: Redis | Cluster | null = null;

  constructor(config: RedisConfig) {
    this.config = {
      host: DEFAULT_HOST,
      port: DEFAULT_PORT,
      db: DEFAULT_DB,
      isCluster: false,
      ...config,
    };
    this.initialize();
  }

  protected initialize(): void {
    this.client = this.createClient();
  }

  protected createClient(): Redis | Cluster {
    const options = this.getRedisOptions();

    if (this.config.isCluster) {
      const nodes = this.config.nodes || [{ host: this.config.host!, port: this.config.port! }];
      return new Cluster(nodes, {
        scaleReads: 'slave',
        redisOptions: options,
      });
    }

    return this.config.connection ? new Redis(this.config.connection as string, options) : new Redis(options);
  }

  protected getRedisOptions(): RedisOptions {
    return {
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.db,
      ...this.config.options,
    };
  }

  async connect(): Promise<void> {
    if (!this.client) throw new Error('Redis client not initialized');
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    if (this.client) await this.client.quit();
  }

  getClient(): Redis | Cluster {
    if (!this.client) throw new Error('Redis client not initialized');
    return this.client;
  }
}
