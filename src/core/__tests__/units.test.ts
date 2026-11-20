import { formatWeight, fromKg, fromKm, toKg, toKm } from '../units';

test('kg ↔ lb round trips', () => {
  expect(fromKg(toKg(100, 'lb'), 'lb')).toBeCloseTo(100);
  expect(toKg(80, 'kg')).toBe(80);
});

test('formats weight in the chosen unit with up to 2 decimals', () => {
  expect(formatWeight(100, 'lb')).toBe('220.46 lb');
  expect(formatWeight(62.5, 'kg')).toBe('62.5 kg');
});

test('km ↔ mi round trips', () => {
  expect(toKm(1, 'mi')).toBeCloseTo(1.609344);
  expect(fromKm(toKm(5, 'mi'), 'mi')).toBeCloseTo(5);
});
