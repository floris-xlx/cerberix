import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  SESSION_COOKIE_NAME: z.string().min(3),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development')
});

export type AppConfig = z.infer<typeof EnvSchema>;

let cached: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment configuration: ${JSON.stringify(message)}`);
  }
  cached = parsed.data;
  return cached;
}

export const config = getConfig();


