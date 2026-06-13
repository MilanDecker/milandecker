/**
 * Forecast Engine — projects a metric forward from its recent history using
 * an exponentially-weighted trend, and estimates the ETA to hit a goal.
 */

export interface ForecastPoint {
  day: number; // days from now (0 = today)
  value: number;
}

export interface Forecast {
  /** Current EWMA level. */
  level: number;
  /** Trend per day (positive = improving). */
  slopePerDay: number;
  /** Projected values for the requested horizon. */
  projection: ForecastPoint[];
  confidence: number; // 0..1, falls with volatility
}

/**
 * @param series chronological values (oldest → newest), evenly spaced by day.
 * @param horizonDays how many days to project forward.
 */
export function forecast(series: number[], horizonDays = 14): Forecast {
  if (series.length === 0) {
    return { level: 0, slopePerDay: 0, projection: [], confidence: 0 };
  }
  if (series.length === 1) {
    return {
      level: series[0],
      slopePerDay: 0,
      projection: Array.from({ length: horizonDays }, (_, i) => ({
        day: i + 1,
        value: series[0],
      })),
      confidence: 0.3,
    };
  }

  const alpha = 0.4;
  let level = series[0];
  let slope = series[1] - series[0];
  for (let i = 1; i < series.length; i++) {
    const prevLevel = level;
    level = alpha * series[i] + (1 - alpha) * (level + slope);
    slope = 0.3 * (level - prevLevel) + 0.7 * slope;
  }

  const projection: ForecastPoint[] = [];
  for (let d = 1; d <= horizonDays; d++) {
    projection.push({ day: d, value: round1(level + slope * d) });
  }

  return { level: round1(level), slopePerDay: round1(slope), projection, confidence: confidenceOf(series) };
}

/** Estimated days until `series` reaches `target` at the current trend. */
export function etaToTarget(series: number[], target: number): number | null {
  const f = forecast(series, 1);
  if (f.slopePerDay === 0) return null;
  const gap = target - f.level;
  const days = gap / f.slopePerDay;
  return days > 0 ? Math.ceil(days) : null;
}

function confidenceOf(series: number[]): number {
  const mean = series.reduce((a, b) => a + b, 0) / series.length;
  const variance =
    series.reduce((a, b) => a + (b - mean) ** 2, 0) / series.length;
  const cv = mean === 0 ? 1 : Math.sqrt(variance) / Math.abs(mean);
  return Math.max(0.2, Math.min(1, 1 - cv));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
