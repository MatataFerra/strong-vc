export type WeightUnit = 'kg' | 'lb';
export type DistanceUnit = 'km' | 'mi';

const KG_PER_LB = 0.45359237;
const KM_PER_MI = 1.609344;

export const toKg = (value: number, unit: WeightUnit) => (unit === 'kg' ? value : value * KG_PER_LB);
export const fromKg = (kg: number, unit: WeightUnit) => (unit === 'kg' ? kg : kg / KG_PER_LB);
export const toKm = (value: number, unit: DistanceUnit) => (unit === 'km' ? value : value * KM_PER_MI);
export const fromKm = (km: number, unit: DistanceUnit) => (unit === 'km' ? km : km / KM_PER_MI);

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function formatWeight(kg: number, unit: WeightUnit): string {
  return `${round2(fromKg(kg, unit))} ${unit}`;
}

export function formatDistance(km: number, unit: DistanceUnit): string {
  return `${round2(fromKm(km, unit))} ${unit}`;
}
