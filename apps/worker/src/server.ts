import express from 'express';
import { z } from 'zod';
import { db } from '@cerberix/db';
import * as tables from '@cerberix/db/src/schema';
import { and, eq } from 'drizzle-orm';
import { EventIngestRequest } from '@cerberix/types';
import { generateId } from '@cerberix/utils';
import { slidingWindowLimit } from '@cerberix/utils';
import { getMonthlyUsage, incrementMonthlyUsage } from '@cerberix/db/src/usage';
import { createDeliveryQueue } from '@cerberix/queue/src/bullmq';
import { hashSecret } from '@cerberix/utils';

const AuthHeaders = z.object({
  projectKey: z.string().min(1),
  authorization: z.string().startsWith('Bearer ').transform((s) => s.slice(7))
});

function sha256Hex(value: string) { return hashSecret(value); }

export function createServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/v1/events', async (req, res) => {
    const parsedHeaders = AuthHeaders.safeParse({
      projectKey: req.header('X-Project-Key'),
      authorization: req.header('Authorization')
    });
    if (!parsedHeaders.success) return res.status(401).json({ error: 'unauthorized' });
    const { projectKey, authorization } = parsedHeaders.data;

    const [project] = await db
      .select()
      .from(tables.projects)
      .where(eq(tables.projects.apiKeyPublic, projectKey))
      .limit(1);
    if (!project) return res.status(401).json({ error: 'invalid_project' });
    const secretHash = sha256Hex(authorization);
    if (secretHash !== project.apiKeySecretHash) return res.status(401).json({ error: 'invalid_secret' });

    const bodyParsed = EventIngestRequest.safeParse(req.body);
    if (!bodyParsed.success) return res.status(400).json({ error: 'invalid_body' });
    const body = bodyParsed.data;

    const limits = project.plan === 'FREE' ? { monthly: project.monthlyEventLimit, rpm: 60 } : { monthly: project.monthlyEventLimit, rpm: 600 };

    const usage = await getMonthlyUsage(project.id);
    if (usage >= limits.monthly) return res.status(429).json({ error: 'monthly_limit_exceeded' });

    const rl = await slidingWindowLimit(`ingest:${project.id}`, limits.rpm, 60);
    if (!rl.allowed) return res.status(429).json({ error: 'rate_limited' });

    if (body.idempotencyKey) {
      const existing = await db
        .select({ id: tables.events.id })
        .from(tables.events)
        .where(and(eq(tables.events.projectId, project.id), eq(tables.events.idempotencyKey, body.idempotencyKey)))
        .limit(1);
      if (existing[0]) return res.json({ eventId: existing[0].id, queuedDeliveriesCount: 0 });
    }

    const eventId = generateId();
    await db.insert(tables.events).values({
      id: eventId,
      projectId: project.id,
      type: body.type,
      payload: body.payload as any,
      idempotencyKey: body.idempotencyKey,
      metadata: body.metadata as any
    });

    const subs = await db
      .select({ id: tables.subscriptions.id })
      .from(tables.subscriptions)
      .where(and(eq(tables.subscriptions.projectId, project.id), eq(tables.subscriptions.eventType, body.type), eq(tables.subscriptions.isActive, true)));

    const queue = createDeliveryQueue();
    let queued = 0;
    for (const s of subs) {
      const deliveryId = generateId();
      await db.insert(tables.deliveries).values({
        id: deliveryId,
        eventId,
        subscriptionId: s.id,
        status: 'PENDING',
        attemptCount: 0
      });
      await queue.add({ deliveryId });
      queued++;
    }

    await incrementMonthlyUsage(project.id, 1);
    res.json({ eventId, queuedDeliveriesCount: queued });
  });

  app.post('/api/v1/deliveries/:id/replay', async (req, res) => {
    const id = String(req.params.id);
    const [d] = await db.select().from(tables.deliveries).where(eq(tables.deliveries.id, id)).limit(1);
    if (!d) return res.status(404).json({ error: 'not_found' });
    const newId = generateId();
    await db.insert(tables.deliveries).values({
      id: newId,
      eventId: d.eventId,
      subscriptionId: d.subscriptionId,
      status: 'PENDING',
      attemptCount: 0,
      isReplay: true
    });
    const queue = createDeliveryQueue();
    await queue.add({ deliveryId: newId });
    res.json({ deliveryId: newId });
  });

  return app;
}


