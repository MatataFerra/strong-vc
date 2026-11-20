import { parseDecimal, validateName, validateScale, validateSetInput } from '../validation';

test('parseDecimal accepts comma or dot decimals', () => {
  expect(parseDecimal('62,5')).toBe(62.5);
  expect(parseDecimal(' 80 ')).toBe(80);
});

test('parseDecimal rejects empty and non-plain numbers', () => {
  expect(parseDecimal('')).toBeNull();
  expect(parseDecimal('1e3')).toBeNull();
  expect(parseDecimal('abc')).toBeNull();
  expect(parseDecimal('-5')).toBeNull();
});

test('validateSetInput accepts a valid set', () => {
  expect(validateSetInput({ weight: '62,5', reps: '8' })).toEqual({ ok: true, value: { weight: 62.5, reps: 8 } });
  expect(validateSetInput({ weight: '0', reps: '12' }).ok).toBe(true);
});

test('validateSetInput rejects out-of-range or fractional reps and excessive weight', () => {
  expect(validateSetInput({ weight: '50', reps: '0' }).ok).toBe(false);
  expect(validateSetInput({ weight: '50', reps: '7.5' }).ok).toBe(false);
  expect(validateSetInput({ weight: '1001', reps: '5' }).ok).toBe(false);
  expect(validateSetInput({ weight: '', reps: '5' }).ok).toBe(false);
});

test('validateScale only allows integers 1–5', () => {
  expect(validateScale(6).ok).toBe(false);
  expect(validateScale(0).ok).toBe(false);
  expect(validateScale(3)).toEqual({ ok: true, value: 3 });
});

test('validateName trims and bounds length', () => {
  expect(validateName('  Pierna  ')).toEqual({ ok: true, value: 'Pierna' });
  expect(validateName('   ').ok).toBe(false);
  expect(validateName('x'.repeat(61)).ok).toBe(false);
});
