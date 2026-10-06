/** Only same-site paths are allowed (open-redirect protection). */
export function safeRedirectPath(value: unknown, fallback = '/'): string {
	if (typeof value !== 'string') return fallback;
	if (!value.startsWith('/') || value.startsWith('//')) return fallback;
	if (value.includes('\\') || value.includes('\n') || value.includes('\r')) return fallback;
	return value;
}
