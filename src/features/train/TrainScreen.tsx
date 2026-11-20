import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useDb } from '../../db/DbProvider';
import { getSettings } from '../../db/repos/settings';
import { deleteTemplate, listTemplates } from '../../db/repos/templates';
import { getActiveWorkout, startWorkout } from '../../db/repos/workouts';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorRetry } from '../../ui/ErrorRetry';
import { Loading } from '../../ui/Loading';
import { Screen } from '../../ui/Screen';
import { useAsync } from '../../ui/useAsync';
import { Body, Muted, Title } from '../../ui/Typography';
import { useSafeAction } from '../../ui/useSafeAction';
import { ActiveWorkout } from './ActiveWorkout';

export function TrainScreen() {
  const db = useDb();
  const router = useRouter();
  const { run, busy } = useSafeAction();
  const { data, loading, error, reload } = useAsync(
    async () => ({
      active: await getActiveWorkout(db),
      templates: await listTemplates(db),
      settings: await getSettings(db),
    }),
    [db],
  );

  useFocusEffect(useCallback(() => reload(), [reload]));

  if (error) return <ErrorRetry message="No se pudieron cargar tus plantillas." onRetry={reload} />;
  if (!data) return loading ? <Loading /> : null;

  if (data.active) {
    return (
      <Screen>
        <ActiveWorkout workout={data.active.workout} sets={data.active.sets} settings={data.settings} onChanged={reload} />
      </Screen>
    );
  }

  const start = (templateId: number | null) =>
    run(async () => {
      await startWorkout(db, templateId);
      reload();
    });

  const remove = (id: number, name: string) =>
    Alert.alert(`¿Borrar "${name}"?`, 'Tu historial no cambia.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => run(async () => { await deleteTemplate(db, id); reload(); }) },
    ]);

  return (
    <Screen>
      <Title>Plantillas</Title>
      {data.templates.length === 0 && (
        <EmptyState title="Todavía no hay plantillas" message="Creá una con los ejercicios que te gustan." />
      )}
      {data.templates.map((t) => (
        <Card key={t.id}>
          <Body style={{ fontWeight: '600' }}>{t.name}</Body>
          <Muted>{t.items.map((i) => `${i.exerciseName} ${i.sets}×${i.reps}`).join(' · ') || 'Sin ejercicios'}</Muted>
          <Button testID={`start-template-${t.id}`} title="Empezar" onPress={() => start(t.id)} disabled={busy} />
          <Button title="Borrar plantilla" variant="secondary" onPress={() => remove(t.id, t.name)} />
        </Card>
      ))}
      <Button title="Crear plantilla" variant="secondary" onPress={() => router.push('/template/new')} />
      <Button testID="start-free" title="Entrenamiento libre" variant="secondary" onPress={() => start(null)} disabled={busy} />
    </Screen>
  );
}
