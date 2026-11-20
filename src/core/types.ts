/** Timestamps are local ISO strings without offset ("2026-11-17T18:00:00"); dates are "YYYY-MM-DD". */
export interface Workout {
  id: number;
  templateId: number | null;
  name: string;
  startedAt: string;
  endedAt: string | null;
  note: string | null;
}

export interface WorkoutSet {
  id: number;
  workoutId: number;
  exerciseId: number | null;
  exerciseName: string;
  position: number;
  weightKg: number;
  reps: number;
  done: boolean;
}

export type LogKind = 'activity' | 'sleep' | 'mood' | 'energy' | 'note';

/** activity: minutes or km (unit), sleep: minutes, mood/energy: 1–5, note: text only. */
export interface DailyLog {
  id: number;
  date: string;
  kind: LogKind;
  value: number | null;
  unit: string | null;
  note: string | null;
}
