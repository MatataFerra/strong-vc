export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const fail = <T>(error: string): Result<T> => ({ ok: false, error });

/** Parses a non-negative plain decimal, accepting "," or "." as separator. */
export function parseDecimal(input: string): number | null {
  const s = input.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

export function validateSetInput(input: { weight: string; reps: string }): Result<{ weight: number; reps: number }> {
  const weight = parseDecimal(input.weight);
  if (weight === null) return fail('Ingresá un peso válido (por ejemplo 62,5).');
  if (weight > 1000) return fail('El peso tiene que estar entre 0 y 1000.');
  const reps = parseDecimal(input.reps);
  if (reps === null || !Number.isInteger(reps) || reps < 1 || reps > 200) {
    return fail('Las repeticiones tienen que ser un número entero entre 1 y 200.');
  }
  return ok({ weight, reps });
}

export function validateScale(n: number): Result<number> {
  return Number.isInteger(n) && n >= 1 && n <= 5 ? ok(n) : fail('Elegí un valor entre 1 y 5.');
}

export function validateName(s: string): Result<string> {
  const name = s.trim();
  if (name.length === 0) return fail('El nombre no puede estar vacío.');
  if (name.length > 60) return fail('El nombre puede tener hasta 60 caracteres.');
  return ok(name);
}
