import type { Translate } from './i18n/index.ts';

/** Rough age text from a YYYY-MM-DD birth date. "now" is a parameter for the tests. */
export function ageText(birthDate: string, t: Translate, now = new Date()): string {
	const born = new Date(birthDate);
	let months = (now.getFullYear() - born.getFullYear()) * 12 + now.getMonth() - born.getMonth();
	if (now.getDate() < born.getDate()) months--;
	if (months < 1) return t('pet.age.underMonth');
	if (months === 1) return t('pet.age.oneMonth');
	if (months < 12) return t('pet.age.months', { n: months });
	const years = Math.floor(months / 12);
	return years === 1 ? t('pet.age.oneYear') : t('pet.age.years', { n: years });
}
