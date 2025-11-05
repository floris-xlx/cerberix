import { z } from 'zod';

export const Plan = z.enum(['FREE', 'PRO', 'ENTERPRISE']);
export type Plan = z.infer<typeof Plan>;

export const DeliveryStatus = z.enum(['PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'DEAD_LETTER']);
export type DeliveryStatus = z.infer<typeof DeliveryStatus>;

export const EventIngestRequest = z.object({
  type: z.string().min(1),
  payload: z.record(z.any()),
  idempotencyKey: z.string().min(1).optional(),
  metadata: z.record(z.any()).optional()
});
export type EventIngestRequest = z.infer<typeof EventIngestRequest>;

export const WebhookPayload = z.object({
  id: z.string(),
  eventId: z.string(),
  eventType: z.string(),
  projectId: z.string(),
  payload: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
  replay: z.boolean().default(false)
});
export type WebhookPayload = z.infer<typeof WebhookPayload>;

export const RetryPolicy = z.object({
  baseSeconds: z.number().int().min(1),
  maxRetries: z.number().int().min(0)
});
export type RetryPolicy = z.infer<typeof RetryPolicy>;


