import { DEFAULT_LOCALE, isLocale, type Locale } from '$lib/i18n';

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

/** Tema claro por defecto; el usuario lo cambia con el ThemeToggle y se recuerda por cookie. */
export const DEFAULT_THEME: Theme = 'light';

export const THEME_COOKIE = 'cv_theme';
export const LOCALE_COOKIE = 'cv_locale';
export const PREFERENCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isTheme(value: unknown): value is Theme {
	return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

export function readTheme(value: string | undefined): Theme {
	return isTheme(value) ? value : DEFAULT_THEME;
}

export function readLocale(value: string | undefined): Locale {
	return isLocale(value) ? value : DEFAULT_LOCALE;
}
