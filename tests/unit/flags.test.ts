import { describe, it, expect } from 'vitest';
import { createInitialSourcingReport } from '$lib/data/sample-report';
import { flag, hasFlagCode, normalizeFlags } from '$lib/domain/flags';
import { normalizeReport } from '$lib/domain/report';
import { evaluateVendorsForGroup } from '$lib/modules/vendor-recommender';
import { DEFAULT_PIPELINE_CONFIG } from '$lib/config/pipeline-config';
import type { AlibabaListing, SourcingReport } from '$lib/types/sourcing';

const listing = (overrides: Partial<AlibabaListing> = {}): AlibabaListing => ({
	title: 'Cable HDMI',
	price: '$1.00',
	priceMin: 1,
	priceMax: 1,
	moq: 500,
	moqUnit: 'pieces',
	supplier: 'Proveedor Uno',
	supplierId: 'uno',
	yearsActive: 1,
	certifications: [],
	hasTradeAssurance: false,
	url: 'https://uno.en.alibaba.com/p/1',
	...overrides
});

describe('normalizeFlags', () => {
	it('conserva los mensajes con código', () => {
		const input = [flag('W_TENURE_UNKNOWN'), flag('W_BRAND_MISMATCH', { brand: 'Intel' })];
		expect(normalizeFlags(input)).toEqual(input);
	});

	it('convierte las cadenas heredadas en LEGACY_TEXT', () => {
		expect(normalizeFlags(['MOQ not confirmed on listing'])).toEqual([
			{ code: 'LEGACY_TEXT', params: { text: 'MOQ not confirmed on listing' } }
		]);
	});

	it('tolera entradas que no son arreglos', () => {
		expect(normalizeFlags(undefined)).toEqual([]);
		expect(normalizeFlags('texto')).toEqual([]);
	});
});

describe('normalizeReport', () => {
	it('migra un reporte con alertas en texto sin perder datos', () => {
		const report = createInitialSourcingReport();
		const legacy = structuredClone(report) as unknown as SourcingReport;
		(legacy.recommendations[0] as unknown as { warnings: unknown }).warnings = ['Texto antiguo'];
		legacy.disqualified = [
			{ position: 1, product: 'X', supplier: 'Y', reasons: ['Motivo' as never] }
		];

		const migrated = normalizeReport(legacy);

		expect(migrated.recommendations[0].warnings).toEqual([
			{ code: 'LEGACY_TEXT', params: { text: 'Texto antiguo' } }
		]);
		expect(migrated.disqualified[0].reasons[0].code).toBe('LEGACY_TEXT');
		expect(migrated.recommendations).toHaveLength(report.recommendations.length);
	});
});

describe('evaluateVendorsForGroup emite códigos', () => {
	const base = {
		targetQty: 100,
		targetUnit: 'pieces',
		maxPrice: null,
		requiredCerts: [],
		filters: DEFAULT_PIPELINE_CONFIG.filters,
		weights: DEFAULT_PIPELINE_CONFIG.weights
	};

	it('descalifica por Trade Assurance obligatorio con su código', () => {
		const { disqualified } = evaluateVendorsForGroup({
			...base,
			listings: [listing()],
			filters: { ...base.filters, requireTradeAssurance: true }
		});
		expect(disqualified).toHaveLength(1);
		expect(hasFlagCode(disqualified[0].disqualificationReasons, 'DQ_TRADE_ASSURANCE_REQUIRED')).toBe(true);
	});

	it('marca MOQ por encima de la cantidad y antigüedad nueva como alertas con parámetros', () => {
		const { qualified } = evaluateVendorsForGroup({
			...base,
			listings: [listing({ moq: 500 })],
			filters: { ...base.filters, requireTradeAssurance: false, strictMoq: false, minYears: 0 }
		});
		const warnings = qualified[0].warnings;
		expect(warnings).toContainEqual({ code: 'W_MOQ_EXCEEDS_QTY', params: { moq: 500, qty: 100 } });
		expect(hasFlagCode(warnings, 'W_NEW_SUPPLIER', 'W_NO_TRADE_ASSURANCE')).toBe(true);
	});
});
