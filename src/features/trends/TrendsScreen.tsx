import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { addDays, localDate, weekStart } from '../../core/dates';
import { formatDay } from '../../core/format';
import { formatWeight } from '../../core/units';
import { weeklySummaries } from '../../core/weekly';
import { useDb } from '../../db/DbProvider';
import { listLogs } from '../../db/repos/logs';
import { getSettings } from '../../db/repos/settings';
import { listSetsSince, listWorkouts } from '../../db/repos/workouts';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorRetry } from '../../ui/ErrorRetry';
import { Loading } from '../../ui/Loading';
import { Screen } from '../../ui/Screen';
import { space, useTheme } from '../../ui/theme';
import { useAsync } from '../../ui/useAsync';
import { Body, Muted, Title } from '../../ui/Typography';

const WEEKS = 8;

export function TrendsScreen() {
  const db = useDb();
  const t = useTheme();
  const { data, error, reload } = useAsync(async () => {
    const today = localDate(new Date());
    const since = addDays(weekStart(today), -7 * (WEEKS - 1));
    const [workouts, sets, logs, settings] = await Promise.all([
      listWorkouts(db, { limit: 1000, since }),
      listSetsSince(db, since),
      listLogs(db, since, today),
      getSettings(db),
    ]);
    return { weeks: weeklySummaries(workouts, sets, logs, WEEKS, today), settings };
  }, [db]);
  useFocusEffect(useCallback(() => reload(), [reload]));

  if (error) return <ErrorRetry message="No se pudieron calcular tus patrones." onRetry={reload} />;
  if (!data) return <Loading label="Calculando…" />;

  const { weeks, settings } = data;
  const current = weeks[weeks.length - 1];
  const hasData = weeks.some((w) => w.activeDays > 0 || w.avgMood !== null || w.avgSleepMin !== null || w.avgEnergy !== null);

  if (!hasData) {
    return (
      <Screen>
        <EmptyState title="Sin datos todavía" message="Cuando registres algo, vas a ver tus patrones semanales acá." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Esta semana</Title>
      <Body>
        {current.activeDays} {current.activeDays === 1 ? 'día activo' : 'días activos'}, {current.workouts}{' '}
        {current.workouts === 1 ? 'entrenamiento' : 'entrenamientos'}, {current.minutes} min en movimiento.
      </Body>

      <Card>
        <Muted>Días activos por semana (últimas {WEEKS})</Muted>
        <View style={styles.chart} accessibilityLabel={weeks.map((w) => `${formatDay(w.weekStart)}: ${w.activeDays}`).join(', ')}>
          {weeks.map((w) => (
            <View key={w.weekStart} style={styles.col}>
              <Muted style={styles.value}>{w.activeDays}</Muted>
              <View style={[styles.bar, { height: 6 + (w.activeDays / 7) * 100, backgroundColor: t.accent, opacity: w.activeDays ? 1 : 0.25 }]} />
            </View>
          ))}
        </View>
      </Card>

      {[...weeks].reverse().map((w) => (
        <Card key={w.weekStart}>
          <Body style={{ fontWeight: '600' }}>Semana del {formatDay(w.weekStart)}</Body>
          <Muted>
            {w.activeDays} días activos · {w.workouts} entrenamientos · {w.minutes} min ·{' '}
            {formatWeight(w.volumeKg, settings.weightUnit)} de volumen
          </Muted>
          {(w.avgSleepMin !== null || w.avgMood !== null || w.avgEnergy !== null) && (
            <Muted>
              {w.avgSleepMin !== null ? `Sueño promedio ${Math.floor(w.avgSleepMin / 60)} h ${Math.round(w.avgSleepMin % 60)} min · ` : ''}
              {w.avgMood !== null ? `Ánimo ${w.avgMood}/5 · ` : ''}
              {w.avgEnergy !== null ? `Energía ${w.avgEnergy}/5` : ''}
            </Muted>
          )}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, height: 130, paddingTop: space.sm },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  value: { fontSize: 12 },
  bar: { width: '70%', borderRadius: 4 },
});
