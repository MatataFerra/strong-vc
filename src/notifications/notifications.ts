import { toExpoWeekday } from '../core/restTimer';

type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null | undefined;

/** Loads expo-notifications lazily; returns null when the native module is unavailable. */
function load(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  try {
    cached = require('expo-notifications') as NotificationsModule;
    cached.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true,
      }),
    });
  } catch {
    cached = null;
  }
  return cached;
}

/** Asks for permission only when needed. Returns false if denied or unavailable. */
export async function ensurePermission(): Promise<boolean> {
  const N = load();
  if (!N) return false;
  try {
    const current = await N.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    return (await N.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function scheduleRestEnd(seconds: number): Promise<string | null> {
  const N = load();
  if (!N || seconds <= 0) return null;
  try {
    if (!(await ensurePermission())) return null;
    return await N.scheduleNotificationAsync({
      content: { title: 'Descanso terminado', body: 'Cuando quieras, seguí con la próxima serie.' },
      trigger: { type: N.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
    });
  } catch {
    return null;
  }
}

/** Weekly reminder; weekday is 1 = lunes … 7 = domingo. */
export async function scheduleWeekly(weekday: number, hour: number, minute: number): Promise<string | null> {
  const N = load();
  if (!N) return null;
  try {
    if (!(await ensurePermission())) return null;
    return await N.scheduleNotificationAsync({
      content: { title: 'Strong personal', body: '¿Te queda bien moverte un rato hoy?' },
      trigger: { type: N.SchedulableTriggerInputTypes.WEEKLY, weekday: toExpoWeekday(weekday), hour, minute },
    });
  } catch {
    return null;
  }
}

export async function cancelNotification(id: string | null): Promise<void> {
  const N = load();
  if (!N || !id) return;
  try {
    await N.cancelScheduledNotificationAsync(id);
  } catch {
    // already gone
  }
}

export async function cancelAllNotifications(): Promise<void> {
  const N = load();
  if (!N) return;
  try {
    await N.cancelAllScheduledNotificationsAsync();
  } catch {
    // nothing to cancel
  }
}
