import { formatClock, remainingSeconds, toExpoWeekday } from '../restTimer';

test('remainingSeconds rounds up and never goes negative', () => {
  expect(remainingSeconds(10_500, 1_000)).toBe(10);
  expect(remainingSeconds(10_001, 1_000)).toBe(10);
  expect(remainingSeconds(0, 5_000)).toBe(0);
});

test('formatClock shows m:ss', () => {
  expect(formatClock(90)).toBe('1:30');
  expect(formatClock(5)).toBe('0:05');
});

test('toExpoWeekday converts Monday-first (1..7) to Sunday-first (1..7)', () => {
  expect(toExpoWeekday(1)).toBe(2); // lunes
  expect(toExpoWeekday(7)).toBe(1); // domingo
});

test('adjusting an expired rest starts from zero instead of the negative overshoot', () => {
  const { adjustedRestSeconds } = require('../restTimer');
  expect(adjustedRestSeconds(1_000, 31_000, 15)).toBe(15);
  expect(adjustedRestSeconds(61_000, 1_000, -15)).toBe(45);
  expect(adjustedRestSeconds(11_000, 1_000, -15)).toBe(0);
});
