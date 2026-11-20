import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { ErrorRetry } from '../ui/ErrorRetry';
import { Loading } from '../ui/Loading';
import { migrate } from './migrations';
import { seedIfEmpty } from './seed';
import type { Db } from './types';

export const DB_NAME = 'strong.db';

const DbContext = createContext<Db | null>(null);

async function openDeviceDb(): Promise<Db> {
  // Lazy so tests (which inject a db) never load the native module.
  const { openDatabaseAsync } = require('expo-sqlite') as typeof import('expo-sqlite');
  const db = (await openDatabaseAsync(DB_NAME)) as unknown as Db;
  await migrate(db);
  await seedIfEmpty(db);
  return db;
}

export function DbProvider({ children, db: injected }: { children: ReactNode; db?: Db }) {
  const [db, setDb] = useState<Db | null>(injected ?? null);
  const [error, setError] = useState<Error | null>(null);

  const open = useCallback(() => {
    if (injected) return;
    setError(null);
    openDeviceDb().then(setDb, (e: unknown) => setError(e instanceof Error ? e : new Error(String(e))));
  }, [injected]);

  useEffect(open, [open]);

  if (error) return <ErrorRetry message="No se pudo abrir la base de datos local." onRetry={open} />;
  if (!db) return <Loading label="Preparando tus datos…" />;
  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}

export function useDb(): Db {
  const db = useContext(DbContext);
  if (!db) throw new Error('useDb must be used inside DbProvider');
  return db;
}
