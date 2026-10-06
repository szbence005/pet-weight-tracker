import { getContext, setContext } from 'svelte';
import { getT, type MessageKey, type Params } from './index.ts';
import { defaultLocale, type Locale } from './locale.ts';

const KEY = Symbol('i18n');

/** Call once in the root layout. The locale is read on every translation, so it stays reactive. */
export function provideT(getLocale: () => Locale): void {
	setContext(KEY, getLocale);
}

/** Returns the translate function for the current component tree (Hungarian without a layout). */
export function useT(): (key: MessageKey, params?: Params) => string {
	const getLocale = getContext<(() => Locale) | undefined>(KEY);
	return (key, params) => getT(getLocale?.() ?? defaultLocale)(key, params);
}
