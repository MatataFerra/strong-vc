import type { Workout, WorkoutSet } from './types';

export interface ExportBundle {
  app: 'strong-personal';
  version: 1;
  exportedAt: string;
  data: Record<string, unknown[]>;
}

export function buildJsonExport(data: Record<string, unknown[]>, now: Date): string {
  const bundle: ExportBundle = { app: 'strong-personal', version: 1, exportedAt: now.toISOString(), data };
  return JSON.stringify(bundle, null, 2);
}

// Spreadsheets execute cells starting with these characters as formulas.
const FORMULA_START = /^[=+\-@\t\r]/;

const csvCell = (v: string | number) => {
  const s = typeof v === 'string' && FORMULA_START.test(v) ? `'${v}` : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function buildSetsCsv(workouts: Workout[], sets: WorkoutSet[]): string {
  const byId = new Map(workouts.map((w) => [w.id, w]));
  const rows = ['date,workout,exercise,set,weight_kg,reps,done'];
  const setNumber = new Map<string, number>();
  for (const s of sets) {
    const w = byId.get(s.workoutId);
    if (!w) continue;
    const key = `${s.workoutId}:${s.exerciseName}`;
    const n = (setNumber.get(key) ?? 0) + 1;
    setNumber.set(key, n);
    rows.push(
      [w.startedAt.slice(0, 10), w.name, s.exerciseName, n, s.weightKg, s.reps, s.done ? 1 : 0].map(csvCell).join(','),
    );
  }
  return rows.join('\n') + '\n';
}
