import { describe, it, expect } from 'vitest';
import {
	formatListedPrice,
	formatMoqLabel,
	formatQty,
	formatSourceLabel,
	tierLabel
} from '$lib/i18n/display';
import { localizeUnit } from '$lib/i18n';
import { sourceUploaded } from '$lib/domain/labels';

describe('formatListedPrice', () => {
	it('normaliza rangos y precios simples en USD', () => {
		expect(formatListedPrice('en', '$1.50-2.50')).toBe('$1.50–$2.50');
		expect(formatListedPrice('es-VE', '$1.50–2.50')).toMatch(/\$\s?1,50–\$\s?2,50/);
		expect(formatListedPrice('es-VE', 'US$3')).toMatch(/\$\s?3,00/);
		expect(formatListedPrice('en', '$2.00-2.00')).toBe('$2.00');
	});

	it('ordena los extremos si vienen invertidos', () => {
		expect(formatListedPrice('en', '$5.00-1.00')).toBe('$1.00–$5.00');
	});

	it('no toca otras monedas ni textos libres', () => {
		expect(formatListedPrice('es-VE', '—')).toBe('—');
		expect(formatListedPrice('es-VE', '€1.20-2.00')).toBe('€1.20-2.00');
		expect(formatListedPrice('es-VE', '1.20 EUR / pieza')).toBe('1.20 EUR / pieza');
	});
});

describe('ayudantes de visualización', () => {
	it('traduce unidades canónicas y alias; deja pasar las desconocidas', () => {
		expect(localizeUnit('es-VE', 'pieces')).toBe('piezas');
		expect(localizeUnit('es-VE', 'PCS')).toBe('piezas');
		expect(localizeUnit('es-VE', 'pairs')).toBe('pares');
		expect(localizeUnit('en', 'packs')).toBe('packs');
		expect(localizeUnit('es-VE', 'ctn')).toBe('ctn');
	});

	it('formatea cantidad con unidad localizada', () => {
		expect(formatQty('es-VE', 120, 'pieces')).toBe('120 piezas');
		expect(formatQty('en', 1500, 'sets')).toBe('1,500 sets');
	});

	it('traduce los MOQ centinela y localiza los de la forma "100 pieces"', () => {
		expect(formatMoqLabel('es-VE', 'Unconfirmed')).toBe('Sin confirmar');
		expect(formatMoqLabel('en', 'Unconfirmed')).toBe('Unconfirmed');
		expect(formatMoqLabel('es-VE', 'N/A')).toBe('N/D');
		expect(formatMoqLabel('es-VE', '100 pieces')).toBe('100 piezas');
		expect(formatMoqLabel('es-VE', 'texto libre')).toBe('texto libre');
	});

	it('traduce las fuentes conocidas y respeta las desconocidas', () => {
		expect(formatSourceLabel('es-VE', 'consolidated')).toBe('Alibaba · Proveedores consolidados');
		expect(formatSourceLabel('en', 'local-validation')).toBe('List · Local validation');
		expect(formatSourceLabel('es-VE', sourceUploaded('lista.xlsx'))).toContain('lista.xlsx');
		expect(formatSourceLabel('es-VE', 'Alibaba · Live')).toBe('Alibaba · Live');
	});

	it('etiqueta los niveles de recomendación por idioma', () => {
		expect(tierLabel('es-VE', 'Strong Recommend')).toBe('Muy recomendado');
		expect(tierLabel('es-VE', 'Caution')).toBe('Precaución');
		expect(tierLabel('en', 'Disqualified')).toBe('Disqualified');
	});
});
