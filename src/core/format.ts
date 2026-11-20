import { minutesBetween } from './dates';

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "jueves 20 nov" from "2026-11-20" (no Intl dependency). */
export function formatDay(date: string): string {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return `${WEEKDAYS[day]} ${d} ${MONTHS[m - 1]}`;
}

export function formatDuration(start: string, end: string | null): string {
  if (!end) return 'en curso';
  const min = minutesBetween(start, end);
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
}
