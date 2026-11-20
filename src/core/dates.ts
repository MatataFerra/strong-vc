const pad = (n: number) => String(n).padStart(2, '0');

export function localDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function localTimestamp(d: Date): string {
  return `${localDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const parseDate = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export function addDays(date: string, days: number): string {
  const d = parseDate(date);
  d.setDate(d.getDate() + days);
  return localDate(d);
}

/** Monday of the week containing `date`. */
export function weekStart(date: string): string {
  const offset = (parseDate(date).getDay() + 6) % 7;
  return addDays(date, -offset);
}

/** Minutes between two local timestamps. */
export function minutesBetween(start: string, end: string): number {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}

/** The day Registros shows: the one the user picked, or today (re-evaluated, so it rolls over at midnight). */
export function resolveLogDate(pinned: string | null, now: Date): string {
  return pinned ?? localDate(now);
}
