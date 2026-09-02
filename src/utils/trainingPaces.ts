// Training paces derived from a race pace at a given distance. Uses Riegel's
// race-equivalence model (time scales with distance^1.06) so that a marathon
// pace and a 5K pace both map onto the same set of training intensities.
// All values are in seconds per km.

export interface TrainingPaces {
  race: number;
  // Threshold: the pace the runner could hold for about an hour.
  threshold: number;
  // VO2max intervals: roughly current 5K race pace.
  interval: number;
  easy: number;
  recovery: number;
}

const RIEGEL_EXPONENT = 1.06;
const THRESHOLD_DURATION_SECONDS = 3600;
const MARATHON_KM = 42.2;

// Pace the runner could race at `targetKm`, given a race pace at `anchorKm`.
export function equivalentRacePace(anchorSecondsPerKm: number, anchorKm: number, targetKm: number): number {
  return anchorSecondsPerKm * Math.pow(targetKm / anchorKm, RIEGEL_EXPONENT - 1);
}

export function deriveTrainingPaces(raceSecondsPerKm: number, raceKm: number): TrainingPaces {
  const race = Math.max(1, raceSecondsPerKm);
  const raceTime = race * raceKm;
  // Distance the runner could cover in an hour, then the pace for that distance.
  const hourDistance = Math.min(
    25,
    Math.max(3, raceKm * Math.pow(THRESHOLD_DURATION_SECONDS / raceTime, 1 / RIEGEL_EXPONENT))
  );
  const threshold = THRESHOLD_DURATION_SECONDS / hourDistance;
  const interval = equivalentRacePace(race, raceKm, 5);
  const easy = equivalentRacePace(race, raceKm, MARATHON_KM) * 1.15;
  const recovery = easy * 1.08;
  return {
    race,
    threshold: Math.round(Math.max(threshold, interval + 5)),
    interval: Math.round(interval),
    easy: Math.round(Math.max(easy, threshold + 20)),
    recovery: Math.round(recovery),
  };
}
