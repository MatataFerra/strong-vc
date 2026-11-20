import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { formatDay, formatDuration } from '../../core/format';
import { formatWeight } from '../../core/units';
import { useDb } from '../../db/DbProvider';
import { getSettings } from '../../db/repos/settings';
import { deleteWorkout, getWorkout, getWorkoutSets } from '../../db/repos/workouts';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorRetry } from '../../ui/ErrorRetry';
import { Loading } from '../../ui/Loading';
import { Screen } from '../../ui/Screen';
import { useToast } from '../../ui/Toast';
import { useAsync } from '../../ui/useAsync';
import { Body, Muted, Title } from '../../ui/Typography';

export function WorkoutDetail({ id }: { id: number }) {
  const db = useDb();
  const router = useRouter();
  const toast = useToast();
  const { data, error, reload } = useAsync(
    async () => ({ workout: await getWorkout(db, id), sets: await getWorkoutSets(db, id), settings: await getSettings(db) }),
    [db, id],
  );

  if (error) return <ErrorRetry message="No se pudo cargar este entrenamiento." onRetry={reload} />;
  if (!data) return <Loading />;
  if (!data.workout) return <EmptyState title="No encontrado" message="Este entrenamiento ya no existe." />;
  const { workout, sets, settings } = data;

  const groups = new Map<string, typeof sets>();
  for (const s of sets) groups.set(s.exerciseName, [...(groups.get(s.exerciseName) ?? []), s]);

  const remove = () =>
    Alert.alert('¿Borrar este entrenamiento?', 'No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          await deleteWorkout(db, id);
          toast('Entrenamiento borrado');
          router.back();
        },
      },
    ]);

  return (
    <Screen>
      <Title>{workout.name}</Title>
      <Muted>{formatDay(workout.startedAt)} · {formatDuration(workout.startedAt, workout.endedAt)}</Muted>
      {workout.note && <Body>{workout.note}</Body>}
      {[...groups.entries()].map(([name, list]) => (
        <Card key={name}>
          <Body style={{ fontWeight: '600' }}>{name}</Body>
          {list.map((s, i) => (
            <Muted key={s.id}>
              {i + 1}. {formatWeight(s.weightKg, settings.weightUnit)} × {s.reps}{s.done ? '' : ' (sin marcar)'}
            </Muted>
          ))}
        </Card>
      ))}
      <Button title="Borrar entrenamiento" variant="secondary" onPress={remove} />
    </Screen>
  );
}
