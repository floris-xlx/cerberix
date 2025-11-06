import { db } from '@cerberix/db';
import * as tables from '@cerberix/db/src/schema';
import { getSession } from '@/lib/auth';
import { eq, desc, inArray } from 'drizzle-orm';

export default async function DeliveriesPage() {
  const userId = await getSession();
  if (!userId) return <div className="p-8">Please sign in.</div>;
  const [project] = await db
    .select()
    .from(tables.projects)
    .where(eq(tables.projects.ownerId, userId))
    .limit(1);

  if (!project) return <div className="p-8">No project yet.</div>;

  const subs = await db
    .select({ id: tables.subscriptions.id })
    .from(tables.subscriptions)
    .where(eq(tables.subscriptions.projectId, project.id));

  const subIds = subs.map((s: { id: string }) => s.id);

  const deliveries = subIds.length
    ? await db
        .select()
        .from(tables.deliveries)
        .where(inArray(tables.deliveries.subscriptionId, subIds))
        .orderBy(desc(tables.deliveries.createdAt))
        .limit(20)
    : [];

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-brand">Deliveries</h1>
      <table className="mt-4 w-full text-sm">
        <thead className="text-secondary">
          <tr>
            <th className="text-left p-2">Created</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Code</th>
            <th className="text-left p-2">Attempts</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((d: (typeof deliveries)[0]) => (
            <tr key={d.id} className="border-t">
              <td className="p-2">{new Date(d.createdAt!).toLocaleString()}</td>
              <td className="p-2">{d.status}</td>
              <td className="p-2">{d.responseCode ?? '-'}</td>
              <td className="p-2">{d.attemptCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
