export type SQLParam = string | number | null;

/** Subset of expo-sqlite's SQLiteDatabase; lets tests swap in better-sqlite3. */
export interface Db {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: SQLParam[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T>(sql: string, ...params: SQLParam[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, ...params: SQLParam[]): Promise<T | null>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
}
