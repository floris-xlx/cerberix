import { db } from './client';
import { monthlyUsage } from './schema';
import { eq, and } from 'drizzle-orm';

export async function getMonthKey(date: Date = new Date()): Promise<string> {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export async function incrementMonthlyUsage(projectId: string, amount = 1): Promise<void> {
  const month = await getMonthKey();
  await db
    .insert(monthlyUsage)
    .values({ id: crypto.randomUUID(), projectId, month, eventCount: amount })
    .onConflictDoUpdate({
      target: [monthlyUsage.projectId, monthlyUsage.month],
      set: { eventCount: (monthlyUsage.eventCount as any) + amount }
    });
}

export async function getMonthlyUsage(projectId: string): Promise<number> {
  const month = await getMonthKey();
  const rows = await db
    .select({ eventCount: monthlyUsage.eventCount })
    .from(monthlyUsage)
    .where(and(eq(monthlyUsage.projectId, projectId), eq(monthlyUsage.month, month)))
    .limit(1);
  return rows[0]?.eventCount ?? 0;
}


