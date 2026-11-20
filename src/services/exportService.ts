import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { localDate } from '../core/dates';
import { buildJsonExport, buildSetsCsv } from '../core/exporter';
import { safeFilename } from '../core/filename';
import type { Workout, WorkoutSet } from '../core/types';
import { getAllForExport, listSetsSince, listWorkouts } from '../db/repos/workouts';
import type { Db } from '../db/types';

async function writeFile(name: string, content: string): Promise<string> {
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  await file.write(content);
  return file.uri;
}

export async function shareFile(uri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Compartir no está disponible en este dispositivo');
  await Sharing.shareAsync(uri);
}

/** Writes a full JSON backup and a CSV of all sets to the cache folder, then shares the JSON. */
export async function exportData(db: Db, now = new Date()): Promise<{ files: string[] }> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Compartir no está disponible en este dispositivo');
  const base = `strong-export-${localDate(now)}`;
  const workouts: Workout[] = await listWorkouts(db, { limit: 1_000_000 });
  const sets: WorkoutSet[] = await listSetsSince(db, '');
  const json = await writeFile(safeFilename(base, 'json'), buildJsonExport(await getAllForExport(db), now));
  const csv = await writeFile(safeFilename(`${base}-series`, 'csv'), buildSetsCsv([...workouts].reverse(), sets));
  await shareFile(json);
  return { files: [json, csv] };
}
