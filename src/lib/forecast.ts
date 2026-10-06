// Weight forecast: a straight line fitted to the most recent measurements, with a band
// that widens the further ahead we look. Pure functions, no I/O.

export type WeightPoint = { measuredAt: string; weightGrams: number };
export type ForecastPoint = {
	date: string;
	realistic: number;
	optimistic: number;
	pessimistic: number;
};
export type GrowthForecast = { points: ForecastPoint[]; gramsPerDay: number };

const DAY_MS = 86_400_000;
const MAX_POINTS = 10; // only recent measurements: growth slows down with age
const MIN_POINTS = 3;
const MIN_SPAN_DAYS = 14;
const BAND = 1; // +/- one standard error of the prediction (roughly a 68 % band)
const STEPS = 12;

export function daysBetween(from: string, to: string): number {
	return Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);
}

export function addDays(isoDate: string, days: number): string {
	return new Date(Date.parse(isoDate) + days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Returns null when there is too little data (fewer than 3 measurements or a span
 * shorter than 14 days). Otherwise realistic = fitted line, optimistic/pessimistic =
 * line plus/minus the prediction error. Weights never go below 0.
 */
export function forecastGrowth(entries: WeightPoint[], horizonDays: number): GrowthForecast | null {
	const used = [...entries]
		.sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
		.slice(-MAX_POINTS);
	if (used.length < MIN_POINTS) return null;

	const origin = used[0].measuredAt;
	const xs = used.map((p) => daysBetween(origin, p.measuredAt));
	const ys = used.map((p) => p.weightGrams);
	const lastX = xs[xs.length - 1];
	if (lastX < MIN_SPAN_DAYS) return null;

	const n = used.length;
	const xMean = xs.reduce((a, b) => a + b, 0) / n;
	const yMean = ys.reduce((a, b) => a + b, 0) / n;
	const sxx = xs.reduce((a, x) => a + (x - xMean) ** 2, 0);
	const sxy = xs.reduce((a, x, i) => a + (x - xMean) * (ys[i] - yMean), 0);
	const slope = sxy / sxx;
	const intercept = yMean - slope * xMean;
	const sse = ys.reduce((a, y, i) => a + (y - (intercept + slope * xs[i])) ** 2, 0);
	const residual = Math.sqrt(sse / (n - 2));

	const step = Math.max(1, Math.round(horizonDays / STEPS));
	const offsets: number[] = [];
	for (let d = step; d < horizonDays; d += step) offsets.push(d);
	offsets.push(horizonDays);

	const points = offsets.map((offset) => {
		const x = lastX + offset;
		const fit = intercept + slope * x;
		const margin = BAND * residual * Math.sqrt(1 + 1 / n + (x - xMean) ** 2 / sxx);
		return {
			date: addDays(origin, x),
			realistic: Math.max(0, Math.round(fit)),
			optimistic: Math.max(0, Math.round(fit + margin)),
			pessimistic: Math.max(0, Math.round(fit - margin))
		};
	});

	return { points, gramsPerDay: slope };
}
