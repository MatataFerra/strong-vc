export const REST_OPTIONS = [60, 90, 120, 180];

/** Whole seconds left until `endsAt` (ms epoch), rounded up, never negative. */
export function remainingSeconds(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000 - 1e-9));
}

export function formatClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** App weekdays are 1 = lunes … 7 = domingo; iOS/expo-notifications use 1 = domingo … 7 = sábado. */
export function toExpoWeekday(weekday: number): number {
  return (weekday % 7) + 1;
}
