import { db } from '@cerberix/db';
import * as tables from '@cerberix/db/src/schema';
import { getSession } from '@/src/lib/auth';
import { eq, desc } from 'drizzle-orm';

export default async function EventsPage() {
  const userId = await getSession();
  if (!userId) return <div className="p-8">Please sign in.</div>;
  const [project] = await db.select().from(tables.projects).where(eq(tables.projects.ownerId, userId)).limit(1);
  if (!project) return <div className="p-8">No project yet.</div>;
  const events = await db
    .select()
    .from(tables.events)
    .where(eq(tables.events.projectId, project.id))
    .orderBy(desc(tables.events.createdAt))
    .limit(20);
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-brand">Events</h1>
      <table className="mt-4 w-full text-sm">
        <thead className="text-secondary">
          <tr>
            <th className="text-left p-2">Created</th>
            <th className="text-left p-2">Type</th>
            <th className="text-left p-2">Id</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className="border-t">
              <td className="p-2">{new Date(e.createdAt!).toLocaleString()}</td>
              <td className="p-2">{e.type}</td>
              <td className="p-2 text-secondary">{e.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


