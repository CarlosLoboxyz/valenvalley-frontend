import { describe, it, expect } from 'vitest';
import { adaptScoreResponse } from '$lib/services/backend/adapter';
import { pipelineConfigFromBackend } from '$lib/config/backend';
import type { DeliverablePayload, PublicConfig } from '$lib/services/backend/types';
import type { PipelineConfig } from '$lib/types/sourcing';

const pipeline: PipelineConfig = {
	granularity: 'balanced',
	stealthProxy: false,
	pagesPerFamily: 1,
	maxProductsPerPage: 15,
	topN: 5,
	fromCache: true,
	dryRun: true,
	filters: {
		requiredCerts: [],
		minYears: 0,
		requireTradeAssurance: false,
		strictMoq: false,
		strictCerts: false,
		strictMinPrice: false,
		maxPriceOverride: null
	},
	weights: {
		price: 30,
		moq: 20,
		tradeAssurance: 20,
		years: 15,
		certs: 15,
		vendorScore: 75,
		rfqFit: 25
	}
};

function deliverable(): DeliverablePayload {
	return {
		meta: {
			source_excel: 'templates/products.xlsx',
			granularity: 'balanced',
			total_products: 2,
			total_families: 1,
			api_call_reduction_pct: 50,
			pages_per_family: 1,
			proxy_mode: 'premium',
			top_n: 5,
			credits_spent: 0,
			generated_at: '2026-11-22T10:00:00Z',
			filters: {}
		},
		recommendations: [
			{
				position: 1,
				name: 'Cable HDMI',
				qty: 200,
				unit: 'pieces',
				min_price: 2.5,
				max_price: 5.5,
				brand: 'OEM Generic',
				family_id: 'FAM_01',
				family_name: 'Cables',
				family_search_query: 'hdmi cable wholesale',
				required_certs_applied: [],
				vendors: [
					{
						supplier: 'Proveedor Uno',
						supplier_id: 'uno.en.alibaba.com',
						recommendation: 'Strong Recommend',
						years_active: 6,
						has_trade_assurance: true,
						certifications: ['ISO9001'],
						best_offer: {
							title: 'Cable HDMI 2m',
							price_raw: 'US$1.50-2.50',
							price_min: 1.5,
							price_max: 2.5,
							price_mid: 2,
							moq: 100,
							moq_unit: 'pieces',
							url: 'https://uno.en.alibaba.com/product/1'
						},
						score_breakdown: {
							price: 90,
							moq: 100,
							years_active: 75,
							trade_assurance: 100,
							certifications: 80
						},
						vendor_score: 88,
						rfq_fit_score: 80,
						total_score: 86,
						pros: ['Competitive pricing (US$1.50-2.50)'],
						warnings: []
					}
				]
			}
		],
		family_search_plan: [
			{
				family_id: 'FAM_01',
				family_name: 'Cables',
				search_query: 'hdmi cable wholesale',
				cohesion_score: 90,
				item_count: 2,
				positions: [1, 2],
				total_qty: 400,
				min_price: 2.5,
				max_price: 5.5,
				sample_items: ['Cable HDMI'],
				listings_scraped: 3
			}
		],
		cross_item_vendors: [
			{
				supplier: 'Proveedor Uno',
				supplier_id: 'uno.en.alibaba.com',
				items_covered: 1,
				families_covered: 1,
				avg_score: 86,
				years_active: 6,
				has_trade_assurance: true,
				certifications: ['ISO9001'],
				positions: [1],
				families: ['FAM_01'],
				item_names: ['Cable HDMI']
			}
		],
		disqualified: [],
		dashboard: {
			tier_distribution: { 'Strong Recommend': 1 },
			score_component_averages: {},
			positions_total: 2,
			positions_without_vendors: 1,
			cross_item_vendors_total: 1,
			cross_item_vendors_multi: 0,
			risk_flag_counts: {},
			missing_cache_families: []
		},
		warnings: []
	};
}

describe('adaptScoreResponse', () => {
	it('mapea el vendor #1 al reporte del frontend', () => {
		const report = adaptScoreResponse(deliverable(), pipeline);
		expect(report.recommendations).toHaveLength(1);

		const item = report.recommendations[0];
		expect(item.supplier).toBe('Proveedor Uno');
		expect(item.tier).toBe('Strong Recommend');
		expect(item.score).toBe(86);
		expect(item.unitPriceMinUsd).toBe(1.5);
		expect(item.unitPriceMaxUsd).toBe(2.5);
		expect(item.moqNumeric).toBe(100);
		expect(item.moqLabel).toBe('100 pieces');
		expect(item.listingUrl).toBe('https://uno.en.alibaba.com/product/1');
		expect(item.isSample).toBe(false);
		// El backend todavía no expone volumen, peso ni tramos: llegan vacíos, sin inventar.
		expect(item.cargoVolumeM3).toBeNull();
		expect(item.cargoWeightKg).toBeNull();
		expect(item.priceTiers).toBeNull();
	});

	it('mapea textos de ventaja a códigos de dominio', () => {
		const report = adaptScoreResponse(deliverable(), pipeline);
		const pros = report.recommendations[0].pros;
		expect(pros).toContainEqual({ code: 'P_PRICE_COMPETITIVE' });
	});

	it('mapea familias y consolidación', () => {
		const report = adaptScoreResponse(deliverable(), pipeline);
		expect(report.families[0].familyId).toBe('FAM_01');
		expect(report.families[0].avgPrice).toBe(4.0);
		expect(report.crossItemVendors[0].supplier).toBe('Proveedor Uno');
		expect(report.crossItemVendors[0].products).toHaveLength(1);
	});

	it('marca como fuente consolidada de Alibaba y fecha ISO del backend', () => {
		const report = adaptScoreResponse(deliverable(), pipeline);
		expect(report.sourceLabel).toBe('consolidated');
		expect(report.runDate).toBe('2026-11-22T10:00:00Z');
	});
});

describe('pipelineConfigFromBackend', () => {
	it('mapea /config público a PipelineConfig', () => {
		const publicConfig: PublicConfig = {
			filters: {
				required_certs: ['CE'],
				min_years: 2,
				require_trade_assurance: true,
				strict_moq: true,
				strict_certs: false,
				strict_min_price: true
			},
			weights: {
				weight_price: 40,
				weight_moq: 15,
				weight_trade_assurance: 15,
				weight_years: 15,
				weight_certs: 15,
				weight_vendor_score: 70,
				weight_rfq_fit: 30
			},
			proxy_mode: 'stealth',
			stealth_default: true,
			granularity: 'broad',
			granularities: ['fine', 'balanced', 'broad'],
			default_pages: 2,
			max_products_per_page: 20,
			recommend_top_n: 3,
			credit_rates: { premium_per_page: 30, stealth_per_page: 80 },
			max_upload_mb: 20,
			require_verified_email: true,
			max_credits_per_job: null,
			max_credits_per_day: null
		};

		const config = pipelineConfigFromBackend(publicConfig);
		expect(config.granularity).toBe('broad');
		expect(config.stealthProxy).toBe(true);
		expect(config.topN).toBe(3);
		expect(config.filters.requireTradeAssurance).toBe(true);
		expect(config.filters.minYears).toBe(2);
		expect(config.filters.requiredCerts).toEqual(['CE']);
		expect(config.weights.price).toBe(40);
		expect(config.weights.vendorScore).toBe(70);
		expect(config.fromCache).toBe(true);
	});

	it('acepta granularidad desconocida cayendo a balanced', () => {
		const publicConfig = {
			filters: {},
			weights: {},
			granularity: 'weird'
		} as unknown as PublicConfig;
		expect(pipelineConfigFromBackend(publicConfig).granularity).toBe('balanced');
	});
});
