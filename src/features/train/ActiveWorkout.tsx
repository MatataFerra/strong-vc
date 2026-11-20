import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { localTimestamp } from '../../core/dates';
import { adjustedRestSeconds, REST_OPTIONS } from '../../core/restTimer';
import type { Workout, WorkoutSet } from '../../core/types';
import { useDb } from '../../db/DbProvider';
import { listExercises, type Exercise } from '../../db/repos/exercises';
import type { Settings } from '../../db/repos/settings';
import { setSetting } from '../../db/repos/settings';
import { addSet, deleteSet, discardWorkout, finishWorkout, updateSet } from '../../db/repos/workouts';
import { writeWorkout } from '../../health/healthkit';
import { cancelNotification, scheduleRestEnd } from '../../notifications/notifications';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Field } from '../../ui/Field';
import { space } from '../../ui/theme';
import { useToast } from '../../ui/Toast';
import { Body, Muted, Title } from '../../ui/Typography';
import { useSafeAction } from '../../ui/useSafeAction';
import { RestTimer } from './RestTimer';
import { SetRow } from './SetRow';

interface Props {
  workout: Workout;
  sets: WorkoutSet[];
  settings: Settings;
  onChanged: () => void;
}

export function ActiveWorkout({ workout, sets, settings, onChanged }: Props) {
  const db = useDb();
  const toast = useToast();
  const [rest, setRest] = useState<{ endsAt: number; notificationId: string | null } | null>(null);
  const [restSeconds, setRestSeconds] = useState(settings.restSeconds);
  const [picker, setPicker] = useState<Exercise[] | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const { run } = useSafeAction();

  const groups = useMemo(() => {
    const map = new Map<string, WorkoutSet[]>();
    for (const s of sets) map.set(s.exerciseName, [...(map.get(s.exerciseName) ?? []), s]);
    return [...map.entries()];
  }, [sets]);

  const startRest = async (seconds: number) => {
    if (rest) await cancelNotification(rest.notificationId);
    const notificationId = settings.remindersMuted ? null : await scheduleRestEnd(seconds);
    setRest({ endsAt: Date.now() + seconds * 1000, notificationId });
  };

  const stopRest = async () => {
    if (rest) await cancelNotification(rest.notificationId);
    setRest(null);
  };

  const saveSet = async (set: WorkoutSet, patch: { weightKg: number; reps: number; done: boolean }) => {
    await updateSet(db, set.id, patch);
    if (patch.done && !set.done) await startRest(restSeconds);
    onChanged();
  };

  const finish = async () => {
    setBusy(true);
    try {
      await stopRest();
      await finishWorkout(db, workout.id, note.trim() || null);
      if (settings.healthWorkouts) await writeWorkout({ ...workout, endedAt: localTimestamp(new Date()) });
      toast('Entrenamiento guardado');
      onChanged();
    } catch {
      Alert.alert('No se pudo guardar', 'Probá de nuevo. Tus series siguen guardadas.');
    } finally {
      setBusy(false);
    }
  };

  const discard = () =>
    Alert.alert('¿Descartar este entrenamiento?', 'Se borran las series de esta sesión.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () =>
          run(async () => {
            await stopRest();
            await discardWorkout(db, workout.id);
            onChanged();
          }),
      },
    ]);

  const pickRest = async (seconds: number) => {
    setRestSeconds(seconds);
    await setSetting(db, 'restSeconds', seconds);
  };

  return (
    <View style={styles.gap}>
      <Title>{workout.name}</Title>
      {rest && (
        <RestTimer
          endsAt={rest.endsAt}
          onSkip={stopRest}
          onAdjust={(d) => run(() => startRest(adjustedRestSeconds(rest.endsAt, Date.now(), d)))}
        />
      )}

      {groups.length === 0 && <Muted>Agregá un ejercicio para empezar.</Muted>}
      {groups.map(([name, groupSets]) => (
        <Card key={name}>
          <Body style={{ fontWeight: '600' }}>{name}</Body>
          {groupSets.map((s, i) => (
            <SetRow
              key={s.id}
              set={s}
              index={i + 1}
              unit={settings.weightUnit}
              onSave={(patch) => run(() => saveSet(s, patch))}
              onRemove={() =>
                run(async () => {
                  await deleteSet(db, s.id);
                  onChanged();
                })
              }
            />
          ))}
          {groupSets[0].exerciseId !== null && (
            <Button
              title="+ Serie"
              variant="secondary"
              onPress={() =>
                run(async () => {
                  await addSet(db, workout.id, groupSets[0].exerciseId as number);
                  onChanged();
                })
              }
            />
          )}
        </Card>
      ))}

      {picker ? (
        <Card>
          <Body style={{ fontWeight: '600' }}>Elegí un ejercicio</Body>
          {picker.map((e) => (
            <Button
              key={e.id}
              title={e.name}
              variant="secondary"
              onPress={() =>
                run(async () => {
                  await addSet(db, workout.id, e.id);
                  setPicker(null);
                  onChanged();
                })
              }
            />
          ))}
          <Button title="Cancelar" variant="secondary" onPress={() => setPicker(null)} />
        </Card>
      ) : (
        <Button title="+ Ejercicio" variant="secondary" onPress={() => run(async () => setPicker(await listExercises(db)))} />
      )}

      <Card>
        <Muted>Descanso entre series</Muted>
        <View style={styles.row}>
          {REST_OPTIONS.map((s) => (
            <Button key={s} title={`${s} s`} variant={s === restSeconds ? 'primary' : 'secondary'} onPress={() => run(() => pickRest(s))} />
          ))}
        </View>
      </Card>

      <Field placeholder="Nota (opcional)" value={note} onChangeText={setNote} maxLength={500} />
      <Button testID="finish-workout" title="Terminar" onPress={finish} disabled={busy} />
      <Button title="Descartar" variant="secondary" onPress={discard} disabled={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: space.md },
  row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
});
