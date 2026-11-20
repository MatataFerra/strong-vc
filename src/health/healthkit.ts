import { Platform } from 'react-native';

import { addDays } from '../core/dates';
import type { Workout } from '../core/types';

/**
 * Optional Apple Health bridge. Off unless EXPO_PUBLIC_HEALTHKIT_ENABLED=true and running in a native build;
 * every function resolves to a neutral value instead of throwing, so the app works without it.
 */
export type HealthKind = 'workouts' | 'sleep' | 'steps';

const SLEEP = 'HKCategoryTypeIdentifierSleepAnalysis';
const STEPS = 'HKQuantityTypeIdentifierStepCount';
const WORKOUT = 'HKWorkoutTypeIdentifier';
const TRADITIONAL_STRENGTH_TRAINING = 50;
// HKCategoryValueSleepAnalysis: 0 = inBed, 2 = awake; everything else is asleep.
const NOT_ASLEEP = new Set([0, 2]);

type HK = typeof import('@kingstinct/react-native-healthkit');

export function isHealthEnabled(): boolean {
  return process.env.EXPO_PUBLIC_HEALTHKIT_ENABLED === 'true' && Platform.OS === 'ios';
}

function load(): HK | null {
  try {
    return require('@kingstinct/react-native-healthkit') as HK;
  } catch {
    return null;
  }
}

export async function isHealthAvailable(): Promise<boolean> {
  const hk = load();
  if (!hk) return false;
  try {
    return await hk.isHealthDataAvailableAsync();
  } catch {
    return false;
  }
}

/** Requests access for a single data type only. */
export async function requestPermission(kind: HealthKind): Promise<boolean> {
  const hk = load();
  if (!hk || !(await isHealthAvailable())) return false;
  const request =
    kind === 'workouts' ? { toShare: [WORKOUT] } : { toRead: [kind === 'sleep' ? SLEEP : STEPS] };
  try {
    return await hk.requestAuthorization(request as Parameters<HK['requestAuthorization']>[0]);
  } catch {
    return false;
  }
}

export async function writeWorkout(w: Workout): Promise<void> {
  const hk = load();
  if (!hk || !w.endedAt) return;
  try {
    await hk.saveWorkoutSample(TRADITIONAL_STRENGTH_TRAINING, [], new Date(w.startedAt), new Date(w.endedAt));
  } catch {
    // Health is optional; the workout is already saved locally.
  }
}

/** Minutes asleep in the night ending on `date` (18:00 the day before → 12:00 that day). */
export async function readSleepMinutes(date: string): Promise<number | null> {
  const hk = load();
  if (!hk) return null;
  try {
    const samples = await hk.queryCategorySamples(SLEEP as never, {
      limit: -1,
      filter: { date: { startDate: new Date(`${addDays(date, -1)}T18:00:00`), endDate: new Date(`${date}T12:00:00`) } },
    });
    const ms = samples
      .filter((s) => !NOT_ASLEEP.has(Number(s.value)))
      .reduce((sum, s) => sum + (new Date(s.endDate).getTime() - new Date(s.startDate).getTime()), 0);
    return samples.length ? Math.round(ms / 60000) : null;
  } catch {
    return null;
  }
}

export async function readSteps(date: string): Promise<number | null> {
  const hk = load();
  if (!hk) return null;
  try {
    const res = await hk.queryStatisticsForQuantity(STEPS as never, ['cumulativeSum'], {
      filter: { date: { startDate: new Date(`${date}T00:00:00`), endDate: new Date(`${addDays(date, 1)}T00:00:00`) } },
    });
    return res.sumQuantity ? Math.round(res.sumQuantity.quantity) : null;
  } catch {
    return null;
  }
}
