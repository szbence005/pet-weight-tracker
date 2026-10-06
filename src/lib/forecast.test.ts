import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, forecastGrowth } from './forecast.ts';

const entry = (measuredAt: string, weightGrams: number) => ({ measuredAt, weightGrams });

describe('date helpers', () => {
	it('adds and measures days', () => {
		expect(addDays('2026-01-30', 3)).toBe('2026-02-02');
		expect(daysBetween('2026-01-01', '2026-01-31')).toBe(30);
	});
});

describe('forecastGrowth', () => {
	it('returns null with fewer than 3 measurements', () => {
		expect(forecastGrowth([entry('2026-01-01', 100), entry('2026-02-01', 120)], 90)).toBeNull();
	});

	it('returns null when the measurements span less than 14 days', () => {
		const e = [entry('2026-01-01', 100), entry('2026-01-05', 101), entry('2026-01-10', 102)];
		expect(forecastGrowth(e, 90)).toBeNull();
	});

	it('extends a perfectly linear series exactly', () => {
		const e = [
			entry('2026-01-01', 1000),
			entry('2026-01-08', 1070),
			entry('2026-01-15', 1140),
			entry('2026-01-22', 1210)
		];
		const result = forecastGrowth(e, 30);
		expect(result?.gramsPerDay).toBeCloseTo(10);
		const last = result?.points.at(-1);
		expect(last?.date).toBe('2026-02-21');
		expect(last?.realistic).toBe(1510);
		expect(last?.optimistic).toBe(1510);
		expect(last?.pessimistic).toBe(1510);
	});

	it('orders optimistic >= realistic >= pessimistic for noisy data', () => {
		const e = [
			entry('2026-01-01', 1000),
			entry('2026-01-10', 1100),
			entry('2026-01-20', 1090),
			entry('2026-02-01', 1260),
			entry('2026-02-15', 1300)
		];
		for (const p of forecastGrowth(e, 180)?.points ?? []) {
			expect(p.optimistic).toBeGreaterThanOrEqual(p.realistic);
			expect(p.realistic).toBeGreaterThanOrEqual(p.pessimistic);
		}
		const first = forecastGrowth(e, 180)!.points[0];
		const last = forecastGrowth(e, 180)!.points.at(-1)!;
		expect(last.optimistic - last.pessimistic).toBeGreaterThan(
			first.optimistic - first.pessimistic
		);
	});

	it('never predicts a negative weight', () => {
		const e = [entry('2026-01-01', 300), entry('2026-01-15', 200), entry('2026-02-01', 100)];
		for (const p of forecastGrowth(e, 365)?.points ?? []) {
			expect(p.pessimistic).toBeGreaterThanOrEqual(0);
			expect(p.realistic).toBeGreaterThanOrEqual(0);
		}
	});

	it('uses only the 10 most recent measurements and ignores input order', () => {
		const old = Array.from({ length: 5 }, (_, i) =>
			entry(`2025-01-${String(i + 1).padStart(2, '0')}`, 5000)
		);
		const recent = Array.from({ length: 10 }, (_, i) =>
			entry(addDays('2026-01-01', i * 7), 1000 + i * 70)
		);
		const shuffled = [...recent, ...old].reverse();
		expect(forecastGrowth(shuffled, 30)?.gramsPerDay).toBeCloseTo(10);
	});
});
