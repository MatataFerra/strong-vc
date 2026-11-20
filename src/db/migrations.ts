import type { Db } from './types';

const MIGRATIONS: string[] = [
  `
  CREATE TABLE exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );
  CREATE TABLE templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );
  CREATE TABLE template_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    sets INTEGER NOT NULL,
    reps INTEGER NOT NULL
  );
  CREATE TABLE workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER REFERENCES templates(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    note TEXT
  );
  CREATE TABLE workout_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id) ON DELETE SET NULL,
    exercise_name TEXT NOT NULL,
    position INTEGER NOT NULL,
    weight_kg REAL NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,
    done INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX idx_sets_workout ON workout_sets(workout_id);
  CREATE TABLE routine_days (
    weekday INTEGER PRIMARY KEY CHECK (weekday BETWEEN 1 AND 7),
    template_id INTEGER REFERENCES templates(id) ON DELETE SET NULL
  );
  CREATE TABLE daily_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('activity','sleep','mood','energy','note')),
    value REAL,
    unit TEXT,
    note TEXT
  );
  CREATE INDEX idx_logs_date ON daily_logs(date);
  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    weekday INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 7),
    hour INTEGER NOT NULL CHECK (hour BETWEEN 0 AND 23),
    minute INTEGER NOT NULL CHECK (minute BETWEEN 0 AND 59),
    enabled INTEGER NOT NULL DEFAULT 1,
    notification_id TEXT
  );
  `,
];

export const USER_TABLES = [
  'workout_sets', 'workouts', 'template_exercises', 'templates', 'routine_days',
  'daily_logs', 'reminders', 'settings', 'exercises',
] as const;

export async function migrate(db: Db): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[v]);
      await db.execAsync(`PRAGMA user_version = ${v + 1}`);
    });
  }
}
