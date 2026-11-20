import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const BANNED = [/fallaste/i, /deber[ií]as/i, /\bracha/i, /r[eé]cord(s|es)? (personal|nuevo)|nuevo r[eé]cord/i, /calor[ií]as/i, /meta de peso/i, /\bmal\b/i];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (f === '__tests__') return [];
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.tsx') ? [p] : [];
  });
}

test('UI copy stays neutral (no judgmental or restrictive wording)', () => {
  const offenders = files(join(__dirname, '../..')).flatMap((f) => {
    const text = readFileSync(f, 'utf8');
    return BANNED.filter((re) => re.test(text)).map((re) => `${f}: ${re}`);
  });
  expect(offenders).toEqual([]);
});
