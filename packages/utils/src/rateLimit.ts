import Redis from 'ioredis';
import { config } from '@cerberix/config';

const redis = new Redis(config.REDIS_URL);

export async function slidingWindowLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }>{
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowKey = `rl:${key}`;
  const cutoff = now - windowMs;
  const pipeline = redis.multi();
  pipeline.zremrangebyscore(windowKey, 0, cutoff);
  pipeline.zadd(windowKey, now, `${now}`);
  pipeline.zcard(windowKey);
  pipeline.expire(windowKey, windowSeconds);
  const [, , count] = (await pipeline.exec()) as [any, any, [null, number], any];
  const allowed = (count?.[1] ?? count) < limit;
  const remaining = Math.max(0, limit - (count?.[1] ?? count));
  return { allowed, remaining };
}


