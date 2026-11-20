import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { addDays, localDate } from '../../core/dates';
import { formatDay } from '../../core/format';
import type { DailyLog, LogKind } from '../../core/types';
import { formatDistance, toKm } from '../../core/units';
import { parseDecimal, validateScale } from '../../core/validation';
import { useDb } from '../../db/DbProvider';
import { addLog, deleteLog, listLogs } from '../../db/repos/logs';
import { getSettings } from '../../db/repos/settings';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorRetry } from '../../ui/ErrorRetry';
import { Field } from '../../ui/Field';
import { Loading } from '../../ui/Loading';
import { Screen } from '../../ui/Screen';
import { space } from '../../ui/theme';
import { useToast } from '../../ui/Toast';
import { useAsync } from '../../ui/useAsync';
import { Body, Muted, Title } from '../../ui/Typography';

const LABELS: Record<LogKind, string> = {
  activity: 'Actividad', sleep: 'Sueño', mood: 'Ánimo', energy: 'Energía', note: 'Nota',
};

export function describeLog(l: DailyLog, distanceUnit: 'km' | 'mi'): string {
  switch (l.kind) {
    case 'activity':
      return l.unit === 'km' ? formatDistance(l.value ?? 0, distanceUnit) : `${l.value} min`;
    case 'sleep':
      return `${Math.floor((l.value ?? 0) / 60)} h ${(l.value ?? 0) % 60} min`;
    case 'mood':
    case 'energy':
      return `${l.value} de 5`;
    default:
      return '';
  }
}

export function LogsScreen() {
  const db = useDb();
  const toast = useToast();
  const [date, setDate] = useState(localDate(new Date()));
  const [kind, setKind] = useState<LogKind>('activity');
  const [amount, setAmount] = useState('');
  const [activityUnit, setActivityUnit] = useState<'min' | 'dist'>('min');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { data, error: loadError, reload } = useAsync(
    async () => ({ logs: await listLogs(db, date, date), settings: await getSettings(db) }),
    [db, date],
  );
  useFocusEffect(useCallback(() => reload(), [reload]));

  if (loadError) return <ErrorRetry message="No se pudieron cargar tus registros." onRetry={reload} />;
  if (!data) return <Loading />;
  const distanceUnit = data.settings.distanceUnit;

  const save = async (value: number | null, unit: string | null) => {
    await addLog(db, { date, kind, value, unit, note: note.trim() || null });
    setAmount(''); setHours(''); setMinutes(''); setNote(''); setError(null);
    toast('Registro guardado');
    reload();
  };

  const submit = async () => {
    if (kind === 'activity') {
      const v = parseDecimal(amount);
      if (v === null || v <= 0 || v > 1440) return setError('Ingresá un número mayor a 0.');
      return activityUnit === 'min' ? save(Math.round(v), 'min') : save(toKm(v, distanceUnit), 'km');
    }
    if (kind === 'sleep') {
      const h = parseDecimal(hours || '0');
      const m = parseDecimal(minutes || '0');
      if (h === null || m === null || h > 24 || m > 59 || h * 60 + m === 0) return setError('Ingresá horas (0–24) y minutos (0–59).');
      return save(Math.round(h * 60 + m), 'min');
    }
    if (kind === 'note') {
      if (!note.trim()) return setError('Escribí algo para guardar la nota.');
      return save(null, null);
    }
    return undefined;
  };

  const saveScale = async (n: number) => {
    const r = validateScale(n);
    if (r.ok) await save(r.value, null);
  };

  return (
    <Screen>
      <View style={styles.row}>
        <Button title="‹" variant="secondary" onPress={() => setDate(addDays(date, -1))} />
        <Title style={{ flex: 1, textAlign: 'center' }}>{formatDay(date)}</Title>
        <Button title="›" variant="secondary" onPress={() => setDate(addDays(date, 1))} disabled={date >= localDate(new Date())} />
      </View>
      <Muted>Todo es opcional. Registrá solo lo que te sirva.</Muted>

      <View style={styles.row}>
        {(Object.keys(LABELS) as LogKind[]).map((k) => (
          <Button key={k} title={LABELS[k]} variant={k === kind ? 'primary' : 'secondary'} onPress={() => { setKind(k); setError(null); }} />
        ))}
      </View>

      <Card>
        {kind === 'activity' && (
          <>
            <View style={styles.row}>
              <Button title="Minutos" variant={activityUnit === 'min' ? 'primary' : 'secondary'} onPress={() => setActivityUnit('min')} />
              <Button title={distanceUnit} variant={activityUnit === 'dist' ? 'primary' : 'secondary'} onPress={() => setActivityUnit('dist')} />
            </View>
            <Field placeholder={activityUnit === 'min' ? 'Ej: 30' : 'Ej: 5,2'} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
          </>
        )}
        {kind === 'sleep' && (
          <View style={styles.row}>
            <Field style={styles.small} placeholder="h" keyboardType="number-pad" value={hours} onChangeText={setHours} accessibilityLabel="Horas" />
            <Muted>h</Muted>
            <Field style={styles.small} placeholder="min" keyboardType="number-pad" value={minutes} onChangeText={setMinutes} accessibilityLabel="Minutos" />
            <Muted>min</Muted>
          </View>
        )}
        {(kind === 'mood' || kind === 'energy') && (
          <>
            <Muted>1 = bajo · 5 = alto. Sin respuestas correctas.</Muted>
            <View style={styles.row}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Button key={n} title={String(n)} variant="secondary" onPress={() => saveScale(n)} />
              ))}
            </View>
          </>
        )}
        <Field placeholder="Nota (opcional)" value={note} onChangeText={setNote} maxLength={500} multiline />
        {error && <Body accessibilityRole="alert">{error}</Body>}
        {kind !== 'mood' && kind !== 'energy' && <Button title="Guardar" onPress={submit} />}
      </Card>

      {data.logs.length === 0 ? (
        <EmptyState title="Nada registrado este día" message="Todo es opcional." />
      ) : (
        data.logs.map((l) => (
          <Card key={l.id}>
            <Body style={{ fontWeight: '600' }}>{LABELS[l.kind]} {describeLog(l, distanceUnit)}</Body>
            {l.note && <Muted>{l.note}</Muted>}
            <Button title="Borrar" variant="secondary" onPress={async () => { await deleteLog(db, l.id); reload(); }} />
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm },
  small: { width: 64, textAlign: 'center' },
});
