import { db } from '@cerberix/db';
import * as tables from '@cerberix/db/src/schema';
import { generateApiKeyPair } from '@cerberix/utils';
import { getSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export default async function DashboardPage() {
  const userId = await getSession();
  if (!userId) return <div className="p-8">Please sign in.</div>;

  async function createProject(formData: FormData) {
    'use server';
    const name = String(formData.get('name') || '');
    const slug = String(formData.get('slug') || '');
    const parsed = z
      .object({ name: z.string().min(1), slug: z.string().min(1) })
      .safeParse({ name, slug });
    if (!parsed.success) return;
    const keys = generateApiKeyPair();
    await db.insert(tables.projects).values({
      id: crypto.randomUUID(),
      ownerId: userId,
      name,
      slug,
      apiKeyPublic: keys.publicKey,
      apiKeySecretHash: keys.secretHash,
      plan: 'FREE',
    });
  }

  async function regen(formData: FormData) {
    'use server';
    const id = String(formData.get('id') || '');
    const keys = generateApiKeyPair();
    await db
      .update(tables.projects)
      .set({ apiKeyPublic: keys.publicKey, apiKeySecretHash: keys.secretHash })
      .where(eq(tables.projects.id, id));
  }

  const projects = await db
    .select()
    .from(tables.projects)
    .where(eq(tables.projects.ownerId, userId));

  const first = projects[0];
  let stats: {
    events24h: number;
    deliveries24h: number;
    successRate: number;
  } | null = null;
  if (first) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [{ count: evCount } = { count: 0 }] = (await db.execute(
      `select count(*)::int as count from events where project_id = $1 and created_at >= $2`,
      [first.id, since],
    )) as any;

    const [{ count: delCount } = { count: 0 }] = (await db.execute(
      `select count(*)::int as count from deliveries where id in (select d.id from deliveries d join subscriptions s on s.id = d.subscription_id where s.project_id = $1) and created_at >= $2`,
      [first.id, since],
    )) as any;

    const [{ rate } = { rate: 0 }] = (await db.execute(
      `select coalesce(avg(case when status = 'SUCCESS' then 1 else 0 end),0) as rate from deliveries d join subscriptions s on s.id = d.subscription_id where s.project_id = $1 and d.created_at >= $2`,
      [first.id, since],
    )) as any;
    stats = { events24h: evCount, deliveries24h: delCount, successRate: Number(rate) };
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-brand">Projects</h1>
      <div className="mt-4 grid md:grid-cols-2 gap-6">
        <form action={createProject} className="p-4 border rounded-md bg-foreground/5">
          <div className="text-secondary mb-2">Create Project</div>
          <input
            name="name"
            placeholder="Name"
            className="w-full mb-2 px-3 py-2 bg-background border rounded-sm"
          />
          <input
            name="slug"
            placeholder="Slug"
            className="w-full mb-2 px-3 py-2 bg-background border rounded-sm"
          />
          <button className="bg-brand text-white px-4 py-2 rounded-md shadow-none">Create</button>
        </form>
        <div className="space-y-3">
          {projects.map((p: (typeof projects)[0]) => (
            <form key={p.id} action={regen} className="p-4 border rounded-md bg-foreground/5">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-secondary">{p.slug}</div>
              <div className="text-sm mt-2">
                Public Key: <span className="text-secondary">{p.apiKeyPublic}</span>
              </div>
              <input type="hidden" name="id" value={p.id} />
              <button className="mt-3 bg-background px-3 py-1 rounded-sm border shadow-none">
                Regenerate Keys
              </button>
            </form>
          ))}
        </div>
      </div>
      {stats && (
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-md bg-foreground/5">
            <div className="text-secondary text-sm">Events (24h)</div>
            <div className="text-2xl font-semibold">{stats.events24h}</div>
          </div>
          <div className="p-4 border rounded-md bg-foreground/5">
            <div className="text-secondary text-sm">Deliveries (24h)</div>
            <div className="text-2xl font-semibold">{stats.deliveries24h}</div>
          </div>
          <div className="p-4 border rounded-md bg-foreground/5">
            <div className="text-secondary text-sm">Success rate (24h)</div>
            <div className="text-2xl font-semibold">{Math.round(stats.successRate * 100)}%</div>
          </div>
        </div>
      )}
    </div>
  );
}
