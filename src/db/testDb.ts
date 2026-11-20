import Database from 'better-sqlite3';

import { migrate } from './migrations';
import { seedIfEmpty } from './seed';
import type { Db, SQLParam } from './types';

/** In-memory SQLite for tests, exposing the same async API as expo-sqlite. */
export function createMemoryDb(): Db {
  const raw = new Database(':memory:');
  return {
    async execAsync(sql) {
      raw.exec(sql);
    },
    async runAsync(sql, ...params: SQLParam[]) {
      const r = raw.prepare(sql).run(...params);
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: r.changes };
    },
    async getAllAsync<T>(sql: string, ...params: SQLParam[]) {
      return raw.prepare(sql).all(...params) as T[];
    },
    async getFirstAsync<T>(sql: string, ...params: SQLParam[]) {
      return (raw.prepare(sql).get(...params) as T | undefined) ?? null;
    },
    async withTransactionAsync(fn) {
      raw.exec('BEGIN');
      try {
        await fn();
        raw.exec('COMMIT');
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      }
    },
  };
}

export async function createTestDb(): Promise<Db> {
  const db = createMemoryDb();
  await migrate(db);
  await seedIfEmpty(db);
  return db;
}
