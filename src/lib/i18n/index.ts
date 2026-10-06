import { hu } from './hu.ts';
import { en } from './en.ts';
import type { Locale } from './locale.ts';

export type MessageKey = keyof typeof hu;
export type Params = Record<string, string | number>;
export type Translate = (key: MessageKey, params?: Params) => string;

export const messages: Record<Locale, Record<MessageKey, string>> = { hu, en };

/** Replaces {name} placeholders; unknown placeholders are left as they are. */
export function fillParams(text: string, params?: Params): string {
	if (!params) return text;
	return text.replace(/\{(\w+)\}/g, (match, name: string) =>
		name in params ? String(params[name]) : match
	);
}

/** Usable on the server and in components. */
export function getT(locale: Locale): Translate {
	const dictionary = messages[locale];
	return (key, params) => fillParams(dictionary[key], params);
}
