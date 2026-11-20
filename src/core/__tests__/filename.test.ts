import { safeFilename } from '../filename';

test('strips path traversal and unsafe characters', () => {
  expect(safeFilename('../Mi Export/2026', 'json')).toBe('mi-export-2026.json');
});

test('falls back when nothing safe remains', () => {
  expect(safeFilename('', 'csv')).toBe('export.csv');
  expect(safeFilename('///', 'csv')).toBe('export.csv');
});

test('caps the base name at 64 characters', () => {
  expect(safeFilename('a'.repeat(100), 'json')).toBe('a'.repeat(64) + '.json');
});
