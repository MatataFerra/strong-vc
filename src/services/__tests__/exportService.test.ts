const mockWritten: Record<string, string> = {};
let mockSharingAvailable = true;
const mockShared: string[] = [];

jest.mock('expo-file-system', () => ({
  Paths: { cache: 'file:///cache' },
  File: class {
    uri: string;
    constructor(dir: string, name: string) {
      this.uri = `${dir}/${name}`;
    }
    create() {}
    async write(content: string) {
      mockWritten[this.uri] = content;
    }
  },
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: async () => mockSharingAvailable,
  shareAsync: async (uri: string) => {
    mockShared.push(uri);
  },
}));

import { createTestDb } from '../../db/testDb';
import { exportData } from '../exportService';

test('writes JSON and CSV with safe dated names and opens the share sheet', async () => {
  const db = await createTestDb();
  const { files } = await exportData(db, new Date(2026, 10, 20, 9, 0));
  expect(files).toEqual(['file:///cache/strong-export-2026-11-20.json', 'file:///cache/strong-export-2026-11-20-series.csv']);
  expect(JSON.parse(mockWritten[files[0]])).toMatchObject({ app: 'strong-personal', version: 1 });
  expect(mockWritten[files[1]]).toBe('date,workout,exercise,set,weight_kg,reps,done\n');
  expect(mockShared).toEqual([files[0]]);
});

test('reports a recoverable error when sharing is unavailable', async () => {
  mockSharingAvailable = false;
  const db = await createTestDb();
  await expect(exportData(db)).rejects.toThrow('Compartir no está disponible en este dispositivo');
});
