import type { Locale } from './index';

/** Etiqueta BCP 47 que `Intl` entiende para cada idioma de la interfaz. */
export function intlLocale(locale: Locale): string {
	return locale === 'en' ? 'en-US' : 'es-VE';
}

export function formatNumber(
	locale: Locale,
	value: number,
	options?: Intl.NumberFormatOptions
): string {
	if (!Number.isFinite(value)) return '—';
	return new Intl.NumberFormat(intlLocale(locale), options).format(value);
}

/** Puntajes y porcentajes con un decimal fijo (es-VE: coma decimal). */
export function formatScore(locale: Locale, value: number): string {
	return formatNumber(locale, Number.isFinite(value) ? value : 0, {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	});
}

/** Dólares estadounidenses con el símbolo `$` en ambos idiomas. */
export function formatUsd(locale: Locale, value: number): string {
	return formatNumber(locale, value, {
		style: 'currency',
		currency: 'USD',
		currencyDisplay: 'narrowSymbol',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
}

/** Rango de presupuesto `min–max` con los extremos disponibles; `null` si no hay ninguno. */
export function formatBudget(
	locale: Locale,
	min: number | null,
	max: number | null
): string | null {
	if (min !== null && max !== null) return `${formatUsd(locale, min)}–${formatUsd(locale, max)}`;
	if (max !== null) return `≤ ${formatUsd(locale, max)}`;
	if (min !== null) return `≥ ${formatUsd(locale, min)}`;
	return null;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

/** Fecha corta localizada. Si no es ISO (reportes antiguos) se devuelve tal cual. */
export function formatDate(locale: Locale, value: string): string {
	const match = ISO_DATE.exec(value);
	if (!match) return value;
	const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
	return new Intl.DateTimeFormat(intlLocale(locale), {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	})
		.format(date)
		.replace(/\./g, '');
}
