import Redis, { RedisOptions } from 'ioredis';
import RedisMock from 'ioredis-mock';
import { config } from '../config';

let redisInstance: Redis | any = null;
let isUsingMock = false;

export function getRedisConnection(): Redis | any {
  if (redisInstance) {
    return redisInstance;
  }

  const options: RedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('⚠️ [Redis] Connection failed 3 times. Falling back to in-memory Redis Mock.');
        return null;
      }
      return Math.min(times * 200, 1000);
    },
  };

  try {
    const client = new Redis(config.redisUrl, options);

    client.on('error', (err) => {
      if (!isUsingMock) {
        console.warn(`⚠️ [Redis Error]: ${err.message}. Using in-memory fallback.`);
      }
    });

    client.on('connect', () => {
      console.log('✅ [Redis] Connected successfully to Redis server at', config.redisUrl);
    });

    redisInstance = client;
    return redisInstance;
  } catch (error) {
    console.warn('⚠️ [Redis] Failed to initialize live Redis, using in-memory Redis Mock.');
    isUsingMock = true;
    redisInstance = new (RedisMock as any)();
    return redisInstance;
  }
}

export function createRedisClient(): Redis | any {
  try {
    const client = new Redis(config.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    return client;
  } catch {
    return new (RedisMock as any)();
  }
}
