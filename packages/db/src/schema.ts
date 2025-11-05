import {
  pgTable,
  varchar,
  text,
  jsonb,
  boolean,
  integer,
  timestamp,
  pgEnum
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const planEnum = pgEnum('plan', ['FREE', 'PRO', 'ENTERPRISE']);
export const deliveryStatusEnum = pgEnum('delivery_status', [
  'PENDING',
  'IN_PROGRESS',
  'SUCCESS',
  'FAILED',
  'DEAD_LETTER'
]);

export const users = pgTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`)
});

export const projects = pgTable('projects', {
  id: varchar('id', { length: 36 }).primaryKey(),
  ownerId: varchar('owner_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  apiKeyPublic: varchar('api_key_public', { length: 255 }).notNull().unique(),
  apiKeySecretHash: varchar('api_key_secret_hash', { length: 255 }).notNull(),
  plan: planEnum('plan').notNull().default('FREE'),
  monthlyEventLimit: integer('monthly_event_limit').notNull().default(10000),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`)
});

export const events = pgTable('events', {
  id: varchar('id', { length: 36 }).primaryKey(),
  projectId: varchar('project_id', { length: 36 }).notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  payload: jsonb('payload').notNull(),
  idempotencyKey: text('idempotency_key'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`)
});

export const subscriptions = pgTable('subscriptions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  projectId: varchar('project_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  eventType: varchar('event_type', { length: 255 }).notNull(),
  targetUrl: text('target_url').notNull(),
  secret: varchar('secret', { length: 255 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  maxRetries: integer('max_retries').notNull().default(10),
  retryBackoffBaseSeconds: integer('retry_backoff_base_seconds').notNull().default(5),
  rateLimitPerMinute: integer('rate_limit_per_minute'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`)
});

export const deliveries = pgTable('deliveries', {
  id: varchar('id', { length: 36 }).primaryKey(),
  eventId: varchar('event_id', { length: 36 }).notNull(),
  subscriptionId: varchar('subscription_id', { length: 36 }).notNull(),
  status: deliveryStatusEnum('status').notNull().default('PENDING'),
  attemptCount: integer('attempt_count').notNull().default(0),
  lastErrorMessage: text('last_error_message'),
  responseCode: integer('response_code'),
  responseBodySnippet: text('response_body_snippet'),
  nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
  firstAttemptAt: timestamp('first_attempt_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  isReplay: boolean('is_replay').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`)
});

export const monthlyUsage = pgTable('monthly_usage', {
  id: varchar('id', { length: 36 }).primaryKey(),
  projectId: varchar('project_id', { length: 36 }).notNull(),
  month: varchar('month', { length: 7 }).notNull(),
  eventCount: integer('event_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`)
});


