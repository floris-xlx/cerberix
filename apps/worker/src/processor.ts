import { db } from '@cerberix/db';
import * as tables from '@cerberix/db/src/schema';
import { and, eq } from 'drizzle-orm';
import { createDeliveryQueue } from '@cerberix/queue/src/bullmq';
import { computeBackoff, signHmacSHA256 } from '@cerberix/utils';

export function startDeliveryProcessor() {
  const queue = createDeliveryQueue();
  queue.process(async ({ deliveryId }) => {
    const [delivery] = await db
      .select()
      .from(tables.deliveries)
      .where(eq(tables.deliveries.id, deliveryId))
      .limit(1);
    if (!delivery) return;

    const [event] = await db
      .select()
      .from(tables.events)
      .where(eq(tables.events.id, delivery.eventId))
      .limit(1);
    const [subscription] = await db
      .select()
      .from(tables.subscriptions)
      .where(eq(tables.subscriptions.id, delivery.subscriptionId))
      .limit(1);
    if (!event || !subscription) return;

    if (!subscription.isActive) {
      await db
        .update(tables.deliveries)
        .set({ status: 'DEAD_LETTER', updatedAt: new Date() })
        .where(eq(tables.deliveries.id, deliveryId));
      return;
    }

    const payload = {
      id: delivery.id,
      eventId: event.id,
      eventType: event.type,
      projectId: event.projectId,
      payload: event.payload as any,
      metadata: event.metadata as any,
      replay: delivery.isReplay ?? false
    };
    const rawBody = JSON.stringify(payload);
    const signature = signHmacSHA256(subscription.secret, rawBody);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let status = 0;
    let bodySnippet = '';
    try {
      const resp = await fetch(subscription.targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Id': delivery.id,
          'X-Webhook-Event-Id': event.id,
          'X-Webhook-Event-Type': event.type,
          'X-Webhook-Retry-Count': String(delivery.attemptCount ?? 0),
          'X-Webhook-Source': 'cerberix',
          ...(event.idempotencyKey ? { 'X-Webhook-Idempotency-Key': event.idempotencyKey } : {})
        },
        body: rawBody,
        signal: controller.signal
      });
      status = resp.status;
      const text = await resp.text();
      bodySnippet = text.slice(0, 2048);

      if (resp.ok) {
        await db
          .update(tables.deliveries)
          .set({
            status: 'SUCCESS',
            responseCode: status,
            responseBodySnippet: bodySnippet,
            completedAt: new Date(),
            updatedAt: new Date(),
            firstAttemptAt: delivery.firstAttemptAt ?? new Date()
          })
          .where(eq(tables.deliveries.id, deliveryId));
        return;
      }
      throw new Error(`HTTP ${status}`);
    } catch (err: any) {
      const attempt = (delivery.attemptCount ?? 0) + 1;
      const max = subscription.maxRetries ?? 10;
      if (attempt < max) {
        const delay = computeBackoff(subscription.retryBackoffBaseSeconds ?? 5, attempt, 500);
        await db
          .update(tables.deliveries)
          .set({
            status: 'PENDING',
            attemptCount: attempt,
            lastErrorMessage: String(err?.message ?? 'error'),
            responseCode: status || null,
            responseBodySnippet: bodySnippet || null,
            nextAttemptAt: new Date(Date.now() + delay),
            firstAttemptAt: delivery.firstAttemptAt ?? new Date(),
            updatedAt: new Date()
          })
          .where(eq(tables.deliveries.id, deliveryId));
        await queue.addDelayed({ deliveryId }, delay);
      } else {
        await db
          .update(tables.deliveries)
          .set({
            status: 'DEAD_LETTER',
            attemptCount: attempt,
            lastErrorMessage: String(err?.message ?? 'error'),
            responseCode: status || null,
            responseBodySnippet: bodySnippet || null,
            updatedAt: new Date()
          })
          .where(eq(tables.deliveries.id, deliveryId));
      }
    } finally {
      clearTimeout(timer);
    }
  });
}


