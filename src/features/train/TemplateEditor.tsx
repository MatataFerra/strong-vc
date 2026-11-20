import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { parseDecimal, validateName } from '../../core/validation';
import { useDb } from '../../db/DbProvider';
import { createExercise, listExercises } from '../../db/repos/exercises';
import { createTemplate } from '../../db/repos/templates';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ErrorRetry } from '../../ui/ErrorRetry';
import { Field } from '../../ui/Field';
import { Loading } from '../../ui/Loading';
import { Screen } from '../../ui/Screen';
import { space } from '../../ui/theme';
import { useToast } from '../../ui/Toast';
import { useAsync } from '../../ui/useAsync';
import { Body, Muted } from '../../ui/Typography';

interface Pick {
  sets: string;
  reps: string;
}

export function TemplateEditor() {
  const db = useDb();
  const router = useRouter();
  const toast = useToast();
  const exercises = useAsync(() => listExercises(db), [db]);
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<Record<number, Pick>>({});
  const [newExercise, setNewExercise] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (exercises.error) return <ErrorRetry message="No se pudieron cargar los ejercicios." onRetry={exercises.reload} />;
  if (!exercises.data) return <Loading />;

  const save = async () => {
    const n = validateName(name);
    if (!n.ok) return setError(n.error);
    const items = [];
    for (const [id, p] of Object.entries(picked)) {
      const sets = parseDecimal(p.sets);
      const reps = parseDecimal(p.reps);
      if (!sets || !reps || !Number.isInteger(sets) || !Number.isInteger(reps) || sets > 10 || reps > 200) {
        return setError('Series (1–10) y repeticiones (1–200) tienen que ser números enteros.');
      }
      items.push({ exerciseId: Number(id), sets, reps });
    }
    if (items.length === 0) return setError('Elegí al menos un ejercicio.');
    await createTemplate(db, n.value, items);
    toast('Plantilla guardada');
    router.back();
  };

  const addExercise = async () => {
    const n = validateName(newExercise);
    if (!n.ok) return setError(n.error);
    const id = await createExercise(db, n.value);
    setNewExercise('');
    setError(null);
    setPicked((p) => ({ ...p, [id]: { sets: '3', reps: '8' } }));
    exercises.reload();
  };

  return (
    <Screen>
      <Field placeholder="Nombre de la plantilla" value={name} onChangeText={setName} maxLength={60} />
      {error && <Body accessibilityRole="alert">{error}</Body>}
      <Button title="Guardar plantilla" onPress={save} />
      <Card>
        <Muted>Ejercicio nuevo</Muted>
        <View style={styles.row}>
          <Field style={{ flex: 1 }} placeholder="Ej: Remo en máquina" value={newExercise} onChangeText={setNewExercise} maxLength={60} />
          <Button title="Agregar" variant="secondary" onPress={addExercise} />
        </View>
      </Card>
      {exercises.data.map((e) => {
        const p = picked[e.id];
        return (
          <Card key={e.id}>
            <View style={styles.row}>
              <Body style={{ flex: 1 }}>{e.name}</Body>
              <Switch
                accessibilityLabel={`Incluir ${e.name}`}
                value={!!p}
                onValueChange={(on) =>
                  setPicked(({ [e.id]: _, ...rest }) => (on ? { ...rest, [e.id]: { sets: '3', reps: '8' } } : rest))
                }
              />
            </View>
            {p && (
              <View style={styles.row}>
                <Field style={styles.small} keyboardType="number-pad" value={p.sets} accessibilityLabel="Series"
                  onChangeText={(sets) => setPicked((all) => ({ ...all, [e.id]: { ...p, sets } }))} />
                <Muted>series ×</Muted>
                <Field style={styles.small} keyboardType="number-pad" value={p.reps} accessibilityLabel="Repeticiones"
                  onChangeText={(reps) => setPicked((all) => ({ ...all, [e.id]: { ...p, reps } }))} />
                <Muted>reps</Muted>
              </View>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  small: { width: 56, textAlign: 'center' },
});
