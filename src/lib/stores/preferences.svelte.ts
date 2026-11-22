import { getContext, setContext } from 'svelte';
import type { FlagMessage } from '$lib/domain/flags';
import {
	formatListedPrice,
	formatMoqLabel,
	formatQty,
	formatSourceLabel,
	tierLabel
} from '$lib/i18n/display';
import type { RecommendationTier } from '$lib/types/sourcing';
import {
	hasMessage,
	localizeUnit,
	translate,
	translateFlag,
	translatePlural,
	type Locale,
	type MessageKey,
	type Params,
	type PluralKey
} from '$lib/i18n';
import { formatBudget, formatDate, formatNumber, formatScore, formatUsd } from '$lib/i18n/format';
import {
	LOCALE_COOKIE,
	PREFERENCE_COOKIE_MAX_AGE,
	THEME_COOKIE,
	type Theme
} from '$lib/preferences/constants';

function writeCookie(name: string, value: string): void {
	document.cookie = `${name}=${value}; path=/; max-age=${PREFERENCE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * Preferencias del usuario (tema e idioma) y todo lo que depende del idioma activo.
 *
 * Se crea UNA instancia por solicitud en el layout raíz y se entrega por contexto:
 * un singleton de módulo se compartiría entre usuarios durante el render en servidor.
 * Las funciones son propiedades flecha para poder desestructurarlas: `const { t } = usePreferences()`.
 */
export class Preferences {
	theme = $state<Theme>('light');
	locale = $state<Locale>('es-VE');

	constructor(theme: Theme, locale: Locale) {
		this.theme = theme;
		this.locale = locale;
	}

	t = (key: MessageKey, params?: Params): string => translate(this.locale, key, params);
	/** Traduce un mensaje que puede ser una clave (esquemas Zod, errores de ingesta) o texto libre. */
	msg = (message: string, params?: Params): string =>
		hasMessage(message) ? translate(this.locale, message, params) : message;
	tn = (key: PluralKey, count: number, params?: Params): string =>
		translatePlural(this.locale, key, count, params);
	flag = (message: FlagMessage): string => translateFlag(this.locale, message);
	n = (value: number, options?: Intl.NumberFormatOptions): string =>
		formatNumber(this.locale, value, options);
	score = (value: number): string => formatScore(this.locale, value);
	usd = (value: number): string => formatUsd(this.locale, value);
	budget = (min: number | null, max: number | null): string =>
		formatBudget(this.locale, min, max) ?? translate(this.locale, 'common.notSpecified');
	date = (value: string): string => formatDate(this.locale, value);
	qty = (qty: number, unit: string): string => formatQty(this.locale, qty, unit);
	unit = (raw: string): string => localizeUnit(this.locale, raw);
	moq = (label: string): string => formatMoqLabel(this.locale, label);
	price = (raw: string): string => formatListedPrice(this.locale, raw);
	source = (label: string): string => formatSourceLabel(this.locale, label);
	tier = (tier: RecommendationTier): string => tierLabel(this.locale, tier);

	setTheme(theme: Theme): void {
		this.theme = theme;
		document.documentElement.dataset.theme = theme;
		writeCookie(THEME_COOKIE, theme);
	}

	toggleTheme(): void {
		this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
	}

	setLocale(locale: Locale): void {
		this.locale = locale;
		document.documentElement.lang = locale;
		writeCookie(LOCALE_COOKIE, locale);
	}
}

const PREFERENCES_KEY = Symbol('cuadramas.preferences');

export function setPreferences(preferences: Preferences): Preferences {
	return setContext(PREFERENCES_KEY, preferences);
}

export function usePreferences(): Preferences {
	return getContext<Preferences>(PREFERENCES_KEY);
}
