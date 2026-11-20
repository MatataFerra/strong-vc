import { useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';

import { useDb } from '../../db/DbProvider';
import { deleteReminder, listReminders } from '../../db/repos/reminders';
import { getSettings, setSetting, type Settings } from '../../db/repos/settings';
import { deleteAllData } from '../../db/repos/workouts';
import { isHealthAvailable, isHealthEnabled, requestPermission, type HealthKind } from '../../health/healthkit';
import { cancelAllNotifications, cancelNotification } from '../../notifications/notifications';
import { addReminder, applyMute, setReminderEnabled } from '../../notifications/reminders';
import { exportData, shareFile } from '../../services/exportService';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ErrorRetry } from '../../ui/ErrorRetry';
import { Field } from '../../ui/Field';
import { Loading } from '../../ui/Loading';
import { Screen } from '../../ui/Screen';
import { space } from '../../ui/theme';
import { useToast } from '../../ui/Toast';
import { useAsync } from '../../ui/useAsync';
import { Body, Muted, Title } from '../../ui/Typography';

export const MEDICAL_DISCLAIMER =
  'Esta app no es atención médica ni reemplaza el consejo de un profesional de la salud.';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const NOTIF_DENIED =
  'Las notificaciones están desactivadas en Ajustes de iOS; los recordatorios no sonarán.';
const HEALTH_KINDS: { kind: HealthKind; key: keyof Settings; label: string }[] = [
  { kind: 'workouts', key: 'healthWorkouts', label: 'Guardar entrenamientos en Salud' },
  { kind: 'sleep', key: 'healthSleep', label: 'Leer sueño desde Salud' },
  { kind: 'steps', key: 'healthSteps', label: 'Leer pasos desde Salud' },
];

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Body style={{ flex: 1 }}>{label}</Body>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} />
    </View>
  );
}

export function SettingsScreen() {
  const db = useDb();
  const toast = useToast();
  const [day, setDay] = useState(1);
  const [time, setTime] = useState('18:00');
  const [notice, setNotice] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [csvUri, setCsvUri] = useState<string | null>(null);
  const { data, error, reload } = useAsync(
    async () => ({
      settings: await getSettings(db),
      reminders: await listReminders(db),
      healthAvailable: isHealthEnabled() && (await isHealthAvailable()),
    }),
    [db],
  );

  if (error) return <ErrorRetry message="No se pudieron cargar los ajustes." onRetry={reload} />;
  if (!data) return <Loading />;
  const { settings, reminders } = data;

  const update = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    await setSetting(db, key, value);
    reload();
  };

  const toggleMute = async (muted: boolean) => {
    await setSetting(db, 'remindersMuted', muted);
    const { failed } = await applyMute(db, muted);
    setNotice(failed ? NOTIF_DENIED : null);
    reload();
  };

  const add = async () => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
    const hour = m ? Number(m[1]) : NaN;
    const minute = m ? Number(m[2]) : NaN;
    if (!(hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59)) return setNotice('Usá el formato HH:MM, por ejemplo 18:30.');
    const { scheduled } = await addReminder(db, { weekday: day, hour, minute }, settings.remindersMuted);
    setNotice(!scheduled && !settings.remindersMuted ? NOTIF_DENIED : null);
    toast('Recordatorio guardado');
    reload();
  };

  const toggleHealth = async (kind: HealthKind, key: keyof Settings, on: boolean) => {
    if (on && !(await requestPermission(kind))) {
      setNotice('No se pudo activar. Podés revisar los permisos en la app Salud.');
      return;
    }
    await update(key, on as never);
  };

  const doExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const { files } = await exportData(db);
      setCsvUri(files[1]);
      toast('Exportación lista');
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'No se pudo exportar.');
    } finally {
      setExporting(false);
    }
  };

  const confirmDelete = () =>
    Alert.alert('¿Borrar todos los datos?', 'Se eliminan entrenamientos, registros, rutinas y recordatorios de este iPhone.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Continuar',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Última confirmación', 'Esto no se puede deshacer. Si querés, exportá antes.', [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Borrar todo',
              style: 'destructive',
              onPress: async () => {
                await cancelAllNotifications();
                await deleteAllData(db);
                toast('Datos borrados');
                reload();
              },
            },
          ]),
      },
    ]);

  return (
    <Screen>
      <Card>
        <Body>{MEDICAL_DISCLAIMER}</Body>
        <Muted>Sin cuentas. Tus datos quedan en este iPhone.</Muted>
      </Card>

      <Title>Unidades</Title>
      <Card>
        <View style={styles.row}>
          <Body style={{ flex: 1 }}>Peso</Body>
          {(['kg', 'lb'] as const).map((u) => (
            <Button key={u} title={u} variant={settings.weightUnit === u ? 'primary' : 'secondary'} onPress={() => update('weightUnit', u)} />
          ))}
        </View>
        <View style={styles.row}>
          <Body style={{ flex: 1 }}>Distancia</Body>
          {(['km', 'mi'] as const).map((u) => (
            <Button key={u} title={u} variant={settings.distanceUnit === u ? 'primary' : 'secondary'} onPress={() => update('distanceUnit', u)} />
          ))}
        </View>
      </Card>

      <Title>Recordatorios</Title>
      <Card>
        <Row label="Silenciar todo" value={settings.remindersMuted} onChange={toggleMute} />
        {reminders.length === 0 && <Muted>No tenés recordatorios.</Muted>}
        {reminders.map((r) => (
          <View key={r.id} style={styles.row}>
            <Body style={{ flex: 1 }}>
              {DAYS[r.weekday - 1]} {String(r.hour).padStart(2, '0')}:{String(r.minute).padStart(2, '0')}
            </Body>
            <Switch
              accessibilityLabel={`Recordatorio ${DAYS[r.weekday - 1]} activo`}
              value={r.enabled}
              onValueChange={async (on) => {
                await setReminderEnabled(db, r.id, on, settings.remindersMuted);
                reload();
              }}
            />
            <Button
              title="Quitar"
              variant="secondary"
              onPress={async () => {
                await cancelNotification(r.notificationId);
                await deleteReminder(db, r.id);
                reload();
              }}
            />
          </View>
        ))}
        <View style={styles.wrap}>
          {DAYS.map((d, i) => (
            <Button key={d} title={d} variant={day === i + 1 ? 'primary' : 'secondary'} onPress={() => setDay(i + 1)} />
          ))}
        </View>
        <View style={styles.row}>
          <Field style={{ width: 90, textAlign: 'center' }} value={time} onChangeText={setTime} accessibilityLabel="Hora" placeholder="18:00" />
          <Button title="Agregar recordatorio" variant="secondary" onPress={add} />
        </View>
        {notice && <Muted accessibilityRole="alert">{notice}</Muted>}
      </Card>

      {isHealthEnabled() && (
        <>
          <Title>Apple Salud</Title>
          <Card>
            {data.healthAvailable ? (
              HEALTH_KINDS.map(({ kind, key, label }) => (
                <Row key={kind} label={label} value={settings[key] as boolean} onChange={(on) => toggleHealth(kind, key, on)} />
              ))
            ) : (
              <Muted>No disponible en este dispositivo.</Muted>
            )}
            <Muted>Cada tipo pide permiso por separado. La app funciona igual sin ellos.</Muted>
          </Card>
        </>
      )}

      <Title>Tus datos</Title>
      <Card>
        <Muted>Exporta un respaldo completo (JSON) y tus series (CSV) para guardarlos en Archivos o enviarlos por AirDrop.</Muted>
        <Button title={exporting ? 'Exportando…' : 'Exportar datos'} onPress={doExport} disabled={exporting} />
        {csvUri && (
          <Button
            title="Compartir series (CSV)"
            variant="secondary"
            onPress={() => shareFile(csvUri).catch((e: Error) => setExportError(e.message))}
          />
        )}
        {exportError && <ErrorRetry message={exportError} onRetry={doExport} />}
        <Button title="Borrar todos los datos" variant="secondary" onPress={confirmDelete} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});
