import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/pg-node';
import { config } from '@cerberix/config';

const pool = new Pool({ connectionString: config.DATABASE_URL });
export const db = drizzle(pool);

export default db;


