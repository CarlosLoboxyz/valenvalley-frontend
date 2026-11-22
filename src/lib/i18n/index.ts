import { CURRENCY_PARAMS, UNIT_PARAMS, type FlagMessage } from '$lib/domain/flags';
import { formatNumber, formatUsd, intlLocale } from './format';
import { en } from './locales/en';
import { esVE, type MessageKey } from './locales/es-VE';

export type { MessageKey };

export const LOCALES = ['es-VE', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** es-VE (español de Venezuela) es el idioma por defecto de la plataforma. */
export const DEFAULT_LOCALE: Locale = 'es-VE';

export type Params = Record<string, string | number>;

/** Base de las claves con plural: `x.one` / `x.other` → `x`. */
export type PluralKey = MessageKey extends infer K
	? K extends `${infer Base}.one`
		? Base
		: never
	: never;

const dictionaries: Record<Locale, Record<MessageKey, string>> = { 'es-VE': esVE, en };

export function isLocale(value: unknown): value is Locale {
	return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function hasMessage(key: string): key is MessageKey {
	return key in esVE;
}

function interpolate(locale: Locale, template: string, params?: Params): string {
	if (!params) return template;
	return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
		const value = params[name];
		if (value === undefined) return placeholder;
		return typeof value === 'number' ? formatNumber(locale, value) : value;
	});
}

export function translate(locale: Locale, key: MessageKey, params?: Params): string {
	const template = dictionaries[locale][key] ?? dictionaries[DEFAULT_LOCALE][key] ?? key;
	return interpolate(locale, template, params);
}

/** Selecciona `.one` / `.other` con las reglas de plural del idioma e inyecta `{count}`. */
export function translatePlural(
	locale: Locale,
	base: PluralKey,
	count: number,
	params?: Params
): string {
	const category = new Intl.PluralRules(intlLocale(locale)).select(count);
	const key = `${base}.${category === 'one' ? 'one' : 'other'}` as MessageKey;
	return translate(locale, key, { count, ...params });
}

const UNIT_ALIASES: Record<string, string> = {
	pieces: 'pieces',
	piece: 'pieces',
	pcs: 'pieces',
	pc: 'pieces',
	packs: 'packs',
	pack: 'packs',
	kits: 'kits',
	kit: 'kits',
	sets: 'sets',
	set: 'sets',
	pairs: 'pairs',
	pair: 'pairs'
};

/** Traduce una unidad canónica (`pieces`, `packs`, …); las desconocidas se muestran tal cual. */
export function localizeUnit(locale: Locale, raw: string): string {
	const canonical = UNIT_ALIASES[raw.trim().toLowerCase()];
	return canonical ? translate(locale, `unit.${canonical}` as MessageKey) : raw;
}

/** Traduce un mensaje de dominio; importes en USD y unidades se formatean según el idioma. */
export function translateFlag(locale: Locale, message: FlagMessage): string {
	const params: Params = {};
	for (const [name, value] of Object.entries(message.params ?? {})) {
		if (typeof value === 'number' && CURRENCY_PARAMS.has(name)) {
			params[name] = formatUsd(locale, value);
		} else if (typeof value === 'string' && UNIT_PARAMS.has(name)) {
			params[name] = localizeUnit(locale, value);
		} else {
			params[name] = value;
		}
	}
	return translate(locale, `flag.${message.code}` as MessageKey, params);
}
