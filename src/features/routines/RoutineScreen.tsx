import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDb } from '../../db/DbProvider';
import { getRoutine, saveRoutine, type RoutineDay } from '../../db/repos/routines';
import { listTemplates } from '../../db/repos/templates';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ErrorRetry } from '../../ui/ErrorRetry';
import { Loading } from '../../ui/Loading';
import { Screen } from '../../ui/Screen';
import { space } from '../../ui/theme';
import { useToast } from '../../ui/Toast';
import { useAsync } from '../../ui/useAsync';
import { Body, Muted } from '../../ui/Typography';

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function RoutineScreen() {
  const db = useDb();
  const toast = useToast();
  const [draft, setDraft] = useState<Record<number, number | null> | null>(null);
  const { data, error, reload } = useAsync(async () => {
    const [templates, routine] = await Promise.all([listTemplates(db), getRoutine(db)]);
    const days: Record<number, number | null> = {};
    for (let d = 1; d <= 7; d++) days[d] = routine.find((r) => r.weekday === d)?.templateId ?? null;
    setDraft(days);
    return { templates };
  }, [db]);

  if (error) return <ErrorRetry message="No se pudo cargar tu rutina." onRetry={reload} />;
  if (!data || !draft) return <Loading />;

  const trainingDays = Object.values(draft).filter((t) => t !== null).length;
  const options: { id: number | null; name: string }[] = [{ id: null, name: 'Descanso' }, ...data.templates];

  const save = async () => {
    const days: RoutineDay[] = Object.entries(draft).map(([weekday, templateId]) => ({ weekday: Number(weekday), templateId }));
    await saveRoutine(db, days);
    toast('Rutina guardada');
  };

  return (
    <Screen>
      <Muted>Un plan semanal flexible. Podés cambiarlo cuando quieras; no hay días "perdidos".</Muted>
      {DAY_NAMES.map((name, i) => {
        const weekday = i + 1;
        return (
          <Card key={weekday}>
            <Body style={{ fontWeight: '600' }}>{name}</Body>
            <View style={styles.row}>
              {options.map((o) => (
                <Button
                  key={o.id ?? 'rest'}
                  title={o.name}
                  variant={draft[weekday] === o.id ? 'primary' : 'secondary'}
                  onPress={() => setDraft({ ...draft, [weekday]: o.id })}
                />
              ))}
            </View>
          </Card>
        );
      })}
      {trainingDays > 6 && <Body>Los días de descanso también son parte del plan.</Body>}
      <Button title="Guardar rutina" onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm } });
