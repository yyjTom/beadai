import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { env } from '@/lib/env';
import * as schema from '@/lib/db/schema';

let db: NeonHttpDatabase<typeof schema> | null = null;
let warned = false;

export const getDb = (): NeonHttpDatabase<typeof schema> | null => {
  if (db) return db;

  if (!env.databaseUrl) {
    if (!warned && process.env.NODE_ENV !== 'production') {
      console.error('[db] DATABASE_URL missing; account and subscription features are disabled.');
      warned = true;
    }
    return null;
  }

  const sql = neon(env.databaseUrl);
  db = drizzle(sql, { schema });
  return db;
};

export const isDbAvailable = (): boolean => getDb() !== null;

export { schema };
