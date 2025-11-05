import { db } from '@cerberix/db';
import * as tables from '@cerberix/db/src/schema';
import { generateId, hashPassword } from '@cerberix/utils';
import { z } from 'zod';
import { setSession } from '@/src/lib/auth';

export default function RegisterPage() {
  async function action(formData: FormData) {
    'use server';
    const email = String(formData.get('email') || '');
    const password = String(formData.get('password') || '');
    const parsed = z
      .object({ email: z.string().email(), password: z.string().min(8) })
      .safeParse({ email, password });
    if (!parsed.success) return;
    const id = generateId();
    const passwordHash = await hashPassword(password);
    await db.insert(tables.users).values({ id, email, passwordHash });
    await setSession(id);
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form action={action} className="w-full max-w-sm p-6 bg-foreground/5 rounded-md">
        <h1 className="text-xl font-semibold text-brand">Create account</h1>
        <label className="block mt-4 text-sm text-secondary">Email</label>
        <input name="email" type="email" className="mt-1 w-full px-3 py-2 bg-background border rounded-sm outline-none" />
        <label className="block mt-3 text-sm text-secondary">Password</label>
        <input name="password" type="password" className="mt-1 w-full px-3 py-2 bg-background border rounded-sm outline-none" />
        <button type="submit" className="mt-6 w-full bg-brand text-white py-2 rounded-md shadow-none">Register</button>
      </form>
    </main>
  );
}


