import type { DistanceUnit, WeightUnit } from '../../core/units';
import type { Db } from '../types';

export interface Settings {
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  restSeconds: number;
  remindersMuted: boolean;
  healthWorkouts: boolean;
  healthSleep: boolean;
  healthSteps: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  weightUnit: 'kg',
  distanceUnit: 'km',
  restSeconds: 90,
  remindersMuted: false,
  healthWorkouts: false,
  healthSleep: false,
  healthSteps: false,
};

export async function getSettings(db: Db): Promise<Settings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  const stored: Record<string, unknown> = {};
  for (const r of rows) {
    if (r.key in DEFAULT_SETTINGS) {
      try {
        stored[r.key] = JSON.parse(r.value);
      } catch {
        // ignore corrupt values; the default wins
      }
    }
  }
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function setSetting<K extends keyof Settings>(db: Db, key: K, value: Settings[K]): Promise<void> {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key, JSON.stringify(value),
  );
}
