import {
	MOQ_NOT_AVAILABLE,
	MOQ_UNCONFIRMED,
	SOURCE_CONSOLIDATED,
	SOURCE_LOCAL_VALIDATION,
	SOURCE_UPLOADED_PREFIX
} from '$lib/domain/labels';
import type { RecommendationTier } from '$lib/types/sourcing';
import { localizeUnit, translate, type Locale, type MessageKey } from './index';
import { formatNumber, formatUsd } from './format';

export function formatQty(locale: Locale, qty: number, unit: string): string {
	return `${formatNumber(locale, qty)} ${localizeUnit(locale, unit)}`;
}

const SIMPLE_USD_PRICE =
	/^\s*(?:US\s?)?\$?\s*(\d+(?:\.\d+)?)(?:\s*[-–]\s*(?:US\s?)?\$?\s*(\d+(?:\.\d+)?))?\s*$/i;

/**
 * Precio listado tal como lo publicó el proveedor. Solo se reformatea el caso simple en USD
 * (`$1.50-2.50`); cualquier otro texto (otra moneda, `—`) se muestra sin tocar.
 */
export function formatListedPrice(locale: Locale, raw: string): string {
	const match = SIMPLE_USD_PRICE.exec(raw);
	if (!match) return raw;
	const first = Number(match[1]);
	const second = match[2] === undefined ? first : Number(match[2]);
	const min = Math.min(first, second);
	const max = Math.max(first, second);
	return min === max
		? formatUsd(locale, min)
		: `${formatUsd(locale, min)}–${formatUsd(locale, max)}`;
}

/** MOQ guardado como `"100 pieces"`, `"Unconfirmed"` o `"N/A"`. */
export function formatMoqLabel(locale: Locale, label: string): string {
	if (label === MOQ_UNCONFIRMED) return translate(locale, 'moq.unconfirmed');
	if (label === MOQ_NOT_AVAILABLE) return translate(locale, 'common.na');
	const match = /^(\d+(?:\.\d+)?)\s+(.+)$/.exec(label);
	if (!match) return label;
	return formatQty(locale, Number(match[1]), match[2]);
}

/** Etiqueta de fuente de datos: códigos conocidos traducidos, texto libre sin tocar. */
export function formatSourceLabel(locale: Locale, label: string): string {
	if (label === SOURCE_CONSOLIDATED) return translate(locale, 'source.consolidated');
	if (label === SOURCE_LOCAL_VALIDATION) return translate(locale, 'source.localValidation');
	if (label.startsWith(SOURCE_UPLOADED_PREFIX)) {
		return translate(locale, 'source.uploaded', {
			name: label.slice(SOURCE_UPLOADED_PREFIX.length)
		});
	}
	return label;
}

const TIER_KEYS: Record<RecommendationTier, MessageKey> = {
	'Strong Recommend': 'tier.strong',
	Consider: 'tier.consider',
	Caution: 'tier.caution',
	Disqualified: 'tier.disqualified'
};

export function tierLabel(locale: Locale, tier: RecommendationTier): string {
	return translate(locale, TIER_KEYS[tier]);
}
