import { db } from '@cerberix/db';
import * as tables from '@cerberix/db/src/schema';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { generateId } from '@cerberix/utils';

export default async function SubscriptionsPage() {
  const userId = await getSession();
  if (!userId) return <div className="p-8">Please sign in.</div>;
  const [project] = await db
    .select()
    .from(tables.projects)
    .where(eq(tables.projects.ownerId, userId))
    .limit(1);
  if (!project) return <div className="p-8">No project yet.</div>;

  async function createSub(formData: FormData) {
    'use server';
    const name = String(formData.get('name') || '');
    const eventType = String(formData.get('eventType') || '');
    const targetUrl = String(formData.get('targetUrl') || '');
    const secret = String(formData.get('secret') || '');
    const maxRetries = Number(formData.get('maxRetries') || 10);
    const retryBackoffBaseSeconds = Number(formData.get('retryBackoffBaseSeconds') || 5);
    const parsed = z
      .object({
        name: z.string().min(1),
        eventType: z.string().min(1),
        targetUrl: z.string().url(),
        secret: z.string().min(8),
      })
      .safeParse({ name, eventType, targetUrl, secret });
    if (!parsed.success) return;
    await db.insert(tables.subscriptions).values({
      id: generateId(),
      projectId: project.id,
      name,
      eventType,
      targetUrl,
      secret,
      maxRetries,
      retryBackoffBaseSeconds,
      isActive: true,
    });
  }

  const subs = await db
    .select()
    .from(tables.subscriptions)
    .where(eq(tables.subscriptions.projectId, project.id));
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-brand">Subscriptions</h1>
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        <form action={createSub} className="p-4 border rounded-md bg-foreground/5">
          <div className="text-secondary mb-2">Create Subscription</div>
          <input
            name="name"
            placeholder="Name"
            className="w-full mb-2 px-3 py-2 bg-background border rounded-sm"
          />
          <input
            name="eventType"
            placeholder="Event type"
            className="w-full mb-2 px-3 py-2 bg-background border rounded-sm"
          />
          <input
            name="targetUrl"
            placeholder="https://example.com/webhook"
            className="w-full mb-2 px-3 py-2 bg-background border rounded-sm"
          />
          <input
            name="secret"
            placeholder="Signing secret"
            className="w-full mb-2 px-3 py-2 bg-background border rounded-sm"
          />
          <div className="flex gap-2">
            <input
              name="maxRetries"
              type="number"
              placeholder="Max retries"
              className="w-1/2 px-3 py-2 bg-background border rounded-sm"
            />
            <input
              name="retryBackoffBaseSeconds"
              type="number"
              placeholder="Backoff base s"
              className="w-1/2 px-3 py-2 bg-background border rounded-sm"
            />
          </div>
          <button className="mt-3 bg-brand text-white px-4 py-2 rounded-md shadow-none">
            Create
          </button>
        </form>
        <div className="space-y-3">
          {subs.map((s: typeof tables.subscriptions.$inferSelect) => (
            <div key={s.id} className="p-4 border rounded-md bg-foreground/5">
              <div className="font-medium">{s.name}</div>
              <div className="text-sm text-secondary">{s.eventType}</div>
              <div className="text-sm mt-2 break-all">{s.targetUrl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
