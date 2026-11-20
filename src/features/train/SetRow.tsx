import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { round2, fromKg, toKg, type WeightUnit } from '../../core/units';
import type { WorkoutSet } from '../../core/types';
import { validateSetInput } from '../../core/validation';
import { Field } from '../../ui/Field';
import { space, useTheme } from '../../ui/theme';
import { Muted } from '../../ui/Typography';

interface Props {
  set: WorkoutSet;
  index: number;
  unit: WeightUnit;
  onSave: (patch: { weightKg: number; reps: number; done: boolean }) => Promise<void>;
  onRemove: () => void;
}

export function SetRow({ set, index, unit, onSave, onRemove }: Props) {
  const t = useTheme();
  const [weight, setWeight] = useState(String(round2(fromKg(set.weightKg, unit))));
  const [reps, setReps] = useState(String(set.reps));
  const [error, setError] = useState<string | null>(null);

  // Re-derive the inputs from the stored values whenever they or the display unit change.
  useEffect(() => {
    setWeight(String(round2(fromKg(set.weightKg, unit))));
    setReps(String(set.reps));
  }, [set.weightKg, set.reps, unit]);

  const save = async (done: boolean) => {
    const result = validateSetInput({ weight, reps });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    await onSave({ weightKg: toKg(result.value.weight, unit), reps: result.value.reps, done });
  };

  // A set already marked done keeps edits without having to untick and tick it again.
  const saveIfDone = () => (set.done ? save(true) : undefined);

  const confirmRemove = () =>
    Alert.alert(`¿Quitar la serie ${index}?`, undefined, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: onRemove },
    ]);

  return (
    <View>
      <View style={styles.row}>
        <Muted style={styles.index}>{index}</Muted>
        <Field
          testID={`set-weight-${set.id}`}
          value={weight}
          onChangeText={setWeight}
          onBlur={saveIfDone}
          keyboardType="decimal-pad"
          accessibilityLabel={`Peso serie ${index} en ${unit}`}
          style={styles.input}
        />
        <Muted>{unit}</Muted>
        <Field
          testID={`set-reps-${set.id}`}
          value={reps}
          onChangeText={setReps}
          onBlur={saveIfDone}
          keyboardType="number-pad"
          accessibilityLabel={`Repeticiones serie ${index}`}
          style={styles.input}
        />
        <Muted>reps</Muted>
        <Pressable
          testID={`set-done-${set.id}`}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: set.done }}
          accessibilityLabel={`Marcar serie ${index} como hecha`}
          accessibilityHint="Mantené presionado para quitar la serie"
          onPress={() => save(!set.done)}
          onLongPress={confirmRemove}
          style={[styles.check, { borderColor: t.accent, backgroundColor: set.done ? t.accent : 'transparent' }]}
        >
          <Text style={{ color: set.done ? t.accentText : t.accent, fontWeight: '700' }}>✓</Text>
        </Pressable>
      </View>
      {error && <Text style={{ color: t.text, fontSize: 13 }}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  index: { width: 18 },
  input: { width: 72, textAlign: 'center' },
  check: { width: 40, height: 40, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
});
