import type { DistanceUnit, Pace } from '../types';

export const KM_PER_MILE = 1.60934;

const UNIT_KEY = 'runathon.unit.v1';

// Distances are stored in kilometers everywhere; these convert at the display edge.
export function kmToUnit(km: number, unit: DistanceUnit): number {
  return unit === 'mi' ? km / KM_PER_MILE : km;
}

export function unitToKm(value: number, unit: DistanceUnit): number {
  return unit === 'mi' ? value * KM_PER_MILE : value;
}

// Paces are stored as seconds (or Pace) per kilometer; a per-mile pace is slower in absolute terms.
export function paceSecondsToUnit(secondsPerKm: number, unit: DistanceUnit): number {
  return unit === 'mi' ? secondsPerKm * KM_PER_MILE : secondsPerKm;
}

export function paceSecondsToKm(secondsPerUnit: number, unit: DistanceUnit): number {
  return unit === 'mi' ? secondsPerUnit / KM_PER_MILE : secondsPerUnit;
}

export function paceToSeconds(pace: Pace): number {
  return Math.max(0, pace.minutes * 60 + pace.seconds);
}

export function paceFromSeconds(totalSeconds: number): Pace {
  const normalized = Math.max(0, Math.round(totalSeconds));
  return { minutes: Math.floor(normalized / 60), seconds: normalized % 60 };
}

export function convertPace(pace: Pace, from: DistanceUnit, to: DistanceUnit): Pace {
  const secondsPerKm = paceSecondsToKm(paceToSeconds(pace), from);
  return paceFromSeconds(paceSecondsToUnit(secondsPerKm, to));
}

export function formatPaceInUnit(pacePerKm: Pace, unit: DistanceUnit): string {
  const display = paceFromSeconds(paceSecondsToUnit(paceToSeconds(pacePerKm), unit));
  return `${display.minutes}:${display.seconds.toString().padStart(2, '0')}/${unit}`;
}

export function formatDistanceInUnit(km: number, unit: DistanceUnit): string {
  const rounded = Math.round(kmToUnit(km, unit) * 10) / 10;
  const value = Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
  return `${value} ${unit}`;
}

export function loadUnit(): DistanceUnit {
  try {
    const stored = localStorage.getItem(UNIT_KEY);
    return stored === 'mi' ? 'mi' : 'km';
  } catch {
    return 'km';
  }
}

export function storeUnit(unit: DistanceUnit): void {
  try {
    localStorage.setItem(UNIT_KEY, unit);
  } catch {
    // Persistence is a convenience; ignore storage failures.
  }
}
