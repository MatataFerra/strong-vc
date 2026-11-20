import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable } from 'react-native';

import { formatDay, formatDuration } from '../../core/format';
import { formatWeight } from '../../core/units';
import { useDb } from '../../db/DbProvider';
import { getSettings } from '../../db/repos/settings';
import { listSetsSince, listWorkouts } from '../../db/repos/workouts';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorRetry } from '../../ui/ErrorRetry';
import { Loading } from '../../ui/Loading';
import { Screen } from '../../ui/Screen';
import { useAsync } from '../../ui/useAsync';
import { Body, Muted } from '../../ui/Typography';

export function HistoryScreen() {
  const db = useDb();
  const router = useRouter();
  const { data, error, reload } = useAsync(async () => {
    const workouts = await listWorkouts(db, { limit: 200 });
    const oldest = workouts.at(-1)?.startedAt ?? '';
    const sets = await listSetsSince(db, oldest);
    const volume = new Map<number, number>();
    for (const s of sets) if (s.done) volume.set(s.workoutId, (volume.get(s.workoutId) ?? 0) + s.weightKg * s.reps);
    return { workouts, volume, settings: await getSettings(db) };
  }, [db]);

  useFocusEffect(useCallback(() => reload(), [reload]));

  if (error) return <ErrorRetry message="No se pudo cargar el historial." onRetry={reload} />;
  if (!data) return <Loading />;
  if (data.workouts.length === 0) {
    return (
      <Screen>
        <EmptyState title="Tus entrenamientos aparecen acá" message="Cuando termines uno, lo vas a ver en esta lista." />
      </Screen>
    );
  }

  return (
    <Screen>
      {data.workouts.map((w) => (
        <Pressable key={w.id} testID={`workout-row-${w.id}`} accessibilityRole="button" onPress={() => router.push(`/workout/${w.id}`)}>
          <Card>
            <Body style={{ fontWeight: '600' }}>{w.name}</Body>
            <Muted>
              {formatDay(w.startedAt)} · {formatDuration(w.startedAt, w.endedAt)} ·{' '}
              {formatWeight(data.volume.get(w.id) ?? 0, data.settings.weightUnit)} de volumen
            </Muted>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
