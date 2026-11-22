import { DEFAULT_PIPELINE_CONFIG } from '$lib/config/pipeline-config';
import { flag, type FlagMessage } from '$lib/domain/flags';
import { MOQ_UNCONFIRMED, SOURCE_CONSOLIDATED } from '$lib/domain/labels';
import { calculateCreditEstimate } from '$lib/modules/cost-estimator';
import type {
	CrossItemVendor,
	FamilyScrapeCache,
	ProductFamily,
	RecommendationItem,
	RfqItem,
	SourcingReport
} from '$lib/types/sourcing';
import { classifyTier, parsePriceRange } from '$lib/utils/format';

interface SeedRow {
	pos: number;
	family: string;
	familyName: string;
	product: string;
	qty: string;
	qtyNumeric: number;
	unit: string;
	budget: string;
	minPrice: number;
	maxPrice: number;
	score: number;
	supplier: string;
	price: string;
	issues: number;
	vendors: number;
}

const SEED_ROWS: SeedRow[] = [
	{ pos: 1, family: 'FAM_03', familyName: 'Hammer', product: '16 oz Claw Hammer', qty: '120 pcs', qtyNumeric: 120, unit: 'pcs', budget: '$4.50–$9.00', minPrice: 4.5, maxPrice: 9.0, score: 44, supplier: 'Zhejiang Jinfeng Tools Co., Ltd.', price: '$1.50–2.50', issues: 4, vendors: 1 },
	{ pos: 2, family: 'FAM_03', familyName: 'Hammer', product: '20 oz Framing Hammer', qty: '80 pcs', qtyNumeric: 80, unit: 'pcs', budget: '$8.00–$15.00', minPrice: 8.0, maxPrice: 15.0, score: 42.5, supplier: 'Zhejiang Jinfeng Tools Co., Ltd.', price: '$1.50–2.50', issues: 4, vendors: 1 },
	{ pos: 3, family: 'FAM_05', familyName: 'Tape measure', product: '25 ft Tape Measure', qty: '200 pcs', qtyNumeric: 200, unit: 'pcs', budget: '$2.50–$5.50', minPrice: 2.5, maxPrice: 5.5, score: 45.3, supplier: 'Zhejiang Juhui Tools Co., Ltd.', price: '$0.50–1.50', issues: 4, vendors: 1 },
	{ pos: 4, family: 'FAM_01', familyName: 'Wrench', product: '10-inch Adjustable Wrench', qty: '150 pcs', qtyNumeric: 150, unit: 'pcs', budget: '$3.00–$6.50', minPrice: 3.0, maxPrice: 6.5, score: 50.6, supplier: 'Guangzhou Kangsheng Garment Co., Ltd.', price: '$1.50–3.50', issues: 4, vendors: 1 },
	{ pos: 5, family: 'FAM_02', familyName: 'Pliers', product: '8-inch Slip Joint Pliers', qty: '180 pcs', qtyNumeric: 180, unit: 'pcs', budget: '$2.00–$4.50', minPrice: 2.0, maxPrice: 4.5, score: 54.9, supplier: 'Hebei Sinotools Industrial Co., Ltd.', price: '$1.95–2.50', issues: 3, vendors: 9 },
	{ pos: 6, family: 'FAM_02', familyName: 'Pliers', product: '6-inch Long Nose Pliers', qty: '150 pcs', qtyNumeric: 150, unit: 'pcs', budget: '$2.20–$4.80', minPrice: 2.2, maxPrice: 4.8, score: 55.6, supplier: 'Hebei Sinotools Industrial Co., Ltd.', price: '$1.95–2.50', issues: 3, vendors: 10 },
	{ pos: 7, family: 'FAM_02', familyName: 'Pliers', product: '10-inch Tongue and Groove Pliers', qty: '100 pcs', qtyNumeric: 100, unit: 'pcs', budget: '$4.00–$8.00', minPrice: 4.0, maxPrice: 8.0, score: 53, supplier: 'RUISHENG INDUSTRIAL CO., LTD.', price: '$4.80–5.18', issues: 3, vendors: 11 },
	{ pos: 8, family: 'FAM_04', familyName: 'Screwdriver', product: '5-piece Screwdriver Set', qty: '200 sets', qtyNumeric: 200, unit: 'sets', budget: '$3.50–$7.00', minPrice: 3.5, maxPrice: 7.0, score: 40.6, supplier: 'Yiwu City Zhongxin Hardware Factory', price: '$1.50–2.50', issues: 5, vendors: 1 },
	{ pos: 9, family: 'FAM_04', familyName: 'Screwdriver', product: '6-in-1 Multi-bit Screwdriver', qty: '250 pcs', qtyNumeric: 250, unit: 'pcs', budget: '$2.00–$4.50', minPrice: 2.0, maxPrice: 4.5, score: 50.6, supplier: 'Yiwu City Zhongxin Hardware Factory', price: '$1.50–2.50', issues: 3, vendors: 1 },
	{ pos: 10, family: 'FAM_06', familyName: 'Utility knife', product: '18mm Utility Knife', qty: '300 pcs', qtyNumeric: 300, unit: 'pcs', budget: '$1.20–$2.80', minPrice: 1.2, maxPrice: 2.8, score: 48.5, supplier: 'Yuyao Kebo Tools Manufacturing Co., Ltd.', price: '$0.21–0.35', issues: 3, vendors: 14 },
	{ pos: 11, family: 'FAM_07', familyName: 'Spirit level', product: '25 ft Aluminum Spirit Level', qty: '80 pcs', qtyNumeric: 80, unit: 'pcs', budget: '$6.00–$12.00', minPrice: 6.0, maxPrice: 12.0, score: 43.4, supplier: 'Shenzhen Xinyuan Technology Co., Ltd.', price: '$2.50–4.50', issues: 5, vendors: 4 },
	{ pos: 12, family: 'FAM_08', familyName: 'Hacksaw', product: '12-inch Hacksaw', qty: '100 pcs', qtyNumeric: 100, unit: 'pcs', budget: '$3.00–$6.00', minPrice: 3.0, maxPrice: 6.0, score: 50.6, supplier: 'Guangzhou Kaiming Apparel Co., Ltd.', price: '$1.50–3.50', issues: 3, vendors: 1 },
	{ pos: 13, family: 'FAM_09', familyName: 'Hand saw', product: '10-inch Hand Saw', qty: '90 pcs', qtyNumeric: 90, unit: 'pcs', budget: '$4.00–$8.00', minPrice: 4.0, maxPrice: 8.0, score: 44, supplier: 'Anhui Jinhui Stainless Steel Products Co., Ltd.', price: '$1.60–3.60', issues: 5, vendors: 10 },
	{ pos: 14, family: 'FAM_10', familyName: 'Wood chisel', product: '1/2-inch Wood Chisel', qty: '120 pcs', qtyNumeric: 120, unit: 'pcs', budget: '$2.50–$5.00', minPrice: 2.5, maxPrice: 5.0, score: 50.6, supplier: 'Guangzhou Kaimao Clothing Co., Ltd.', price: '$1.50–3.50', issues: 3, vendors: 1 },
	{ pos: 15, family: 'FAM_11', familyName: 'File', product: '4-piece File Set', qty: '8-inch*', qtyNumeric: 100, unit: 'sets', budget: '$80–$5*', minPrice: 5.0, maxPrice: 80.0, score: 49.1, supplier: 'Guangzhou Kaimao Clothing Co., Ltd.', price: '$2.50–5.50', issues: 4, vendors: 1 },
	{ pos: 16, family: 'FAM_01', familyName: 'Wrench', product: '12-inch Pipe Wrench', qty: '60 pcs', qtyNumeric: 60, unit: 'pcs', budget: '$8.00–$15.00', minPrice: 8.0, maxPrice: 15.0, score: 40.6, supplier: 'Guangzhou Kangsheng Garment Co., Ltd.', price: '$1.50–3.50', issues: 5, vendors: 1 },
	{ pos: 17, family: 'FAM_12', familyName: 'Socket set', product: '1/2-inch Drive Socket Set (40-piece)', qty: '70 sets', qtyNumeric: 70, unit: 'sets', budget: '$12–$25', minPrice: 12.0, maxPrice: 25.0, score: 49.5, supplier: 'Shenzhen Xinrui Clothing Co., Ltd.', price: '$4.50–12.00', issues: 4, vendors: 10 },
	{ pos: 18, family: 'FAM_13', familyName: 'Drill', product: '3/8-inch Cordless Drill (20V)', qty: '50 pcs', qtyNumeric: 50, unit: 'pcs', budget: '$25–$45', minPrice: 25.0, maxPrice: 45.0, score: 43.4, supplier: 'Guangzhou Kangsheng Garment Co., Ltd.', price: '$1.50–3.50', issues: 5, vendors: 8 },
	{ pos: 19, family: 'FAM_01', familyName: 'Wrench', product: '1/2-inch Impact Wrench (Corded)', qty: '40 pcs', qtyNumeric: 40, unit: 'pcs', budget: '$30–$55', minPrice: 30.0, maxPrice: 55.0, score: 40.6, supplier: 'Guangzhou Kangsheng Garment Co., Ltd.', price: '$1.50–3.50', issues: 5, vendors: 1 },
	{ pos: 20, family: 'FAM_14', familyName: 'Angle grinder', product: '4.5-inch Angle Grinder', qty: '60 pcs', qtyNumeric: 60, unit: 'pcs', budget: '$18–$35', minPrice: 18.0, maxPrice: 35.0, score: 40.6, supplier: 'Guangzhou Yinuo Garment Co., Ltd.', price: '$1.50–3.50', issues: 5, vendors: 1 }
];

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 28);
}

export function createInitialSourcingReport(): SourcingReport {
	const rfqItems: RfqItem[] = SEED_ROWS.map((row) => ({
		position: row.pos,
		name: row.product,
		description: `Industrial-grade ${row.product.toLowerCase()} for B2B wholesale tooling catalog`,
		unit: row.unit,
		normalizedUnit: row.unit,
		qty: row.qtyNumeric,
		qtyLabel: row.qty,
		minPrice: row.minPrice,
		maxPrice: row.maxPrice,
		budgetLabel: row.budget,
		brand: 'OEM Generic',
		flexibleBrand: true,
		technicalSpecs: {
			category: row.familyName,
			grade: 'Commercial',
			unit: row.unit
		},
		requiredCerts: []
	}));

	const familyMap = new Map<string, ProductFamily>();
	for (const row of SEED_ROWS) {
		const existing = familyMap.get(row.family);
		if (existing) {
			existing.positions.push(row.pos);
			existing.itemCount++;
		} else {
			familyMap.set(row.family, {
				familyId: row.family,
				name: row.familyName,
				searchQuery: `${row.familyName.toLowerCase()} wholesale supplier`,
				cohesionScore: row.family === 'FAM_01' || row.family === 'FAM_02' ? 88 : 94,
				positions: [row.pos],
				itemCount: 1,
				avgPrice: Number(((row.minPrice + row.maxPrice) / 2).toFixed(2))
			});
		}
	}

	const families = Array.from(familyMap.values()).sort(
		(a, b) => b.itemCount - a.itemCount || a.familyId.localeCompare(b.familyId)
	);

	// Build query-keyed scrape cache so offline re-scoring works out of the box at 0 credits
	const cache: FamilyScrapeCache = {};
	for (const fam of families) {
		const rowsInFam = SEED_ROWS.filter((r) => r.family === fam.familyId);
		const key = fam.searchQuery.toLowerCase();
		cache[key] = {
			query: fam.searchQuery,
			scrapedAt: '2026-11-22T06:00:00Z',
			creditsUsed: 30,
			listings: rowsInFam.map((r) => {
				const parsed = parsePriceRange(r.price);
				const hasTA = r.score >= 52;
				return {
					title: `${r.product} Wholesale Factory Direct`,
					price: r.price,
					priceMin: parsed.min,
					priceMax: parsed.max,
					moq: r.issues <= 3 ? Math.min(100, r.qtyNumeric) : null,
					moqUnit: r.unit,
					supplier: r.supplier,
					supplierId: slugify(r.supplier),
					yearsActive: r.score >= 52 ? 5 : null,
					certifications: r.score >= 52 ? ['ISO9001'] : [],
					hasTradeAssurance: hasTA,
					url: `https://www.alibaba.com/product-detail/${slugify(r.product)}.html`
				};
			})
		};
	}

	const recommendations: RecommendationItem[] = SEED_ROWS.map((row) => {
		const warnings: FlagMessage[] = [
			flag('W_MOQ_UNCONFIRMED'),
			flag('W_BRAND_MISMATCH', { brand: 'OEM Generic' })
		];
		if (row.issues >= 4) warnings.push(flag('W_BELOW_TARGET_FLOOR', { min: row.minPrice }));
		if (row.issues >= 5) warnings.push(flag('W_TENURE_UNKNOWN'));
		if (row.score < 52) warnings.push(flag('W_NO_TRADE_ASSURANCE'));

		const pros: FlagMessage[] = [];
		if (row.score >= 52) {
			pros.push(flag('P_PRICE_COMPETITIVE'));
			pros.push(flag('P_TRADE_ASSURANCE'));
		} else {
			pros.push(flag('P_LOW_PRICE_QUOTE'));
		}

		return {
			pos: row.pos,
			family: row.family,
			familyName: row.familyName,
			product: row.product,
			qty: row.qty,
			qtyNumeric: row.qtyNumeric,
			unit: row.unit,
			budget: row.budget,
			minPrice: row.minPrice,
			maxPrice: row.maxPrice,
			brand: 'OEM Generic',
			score: row.score,
			tier: classifyTier(row.score),
			supplier: row.supplier,
			supplierId: slugify(row.supplier),
			price: row.price,
			issues: row.issues,
			vendors: row.vendors,
			breakdown: {
				price: row.score >= 52 ? 82 : 68,
				moqFit: row.issues <= 3 ? 75 : 40,
				tradeAssurance: row.score >= 52 ? 100 : 0,
				yearsActive: row.score >= 52 ? 62 : 30,
				certifications: row.score >= 52 ? 60 : 35,
				vendorScore: Number((row.score + 1.5).toFixed(1)),
				rfqFitScore: Math.round(row.score - 4.5),
				finalScore: row.score
			},
			pros,
			warnings: warnings.slice(0, row.issues),
			alternatives: [],
			disqualifiedCount: 0,
			listingUrl: `https://www.alibaba.com/product-detail/${slugify(row.product)}.html`,
			moqLabel: row.issues <= 3 ? `${Math.min(100, row.qtyNumeric)} ${row.unit}` : MOQ_UNCONFIRMED,
			yearsActive: row.score >= 52 ? 5 : null,
			hasTradeAssurance: row.score >= 52,
			certifications: row.score >= 52 ? ['ISO9001'] : []
		};
	});

	const vendorGroups = new Map<string, RecommendationItem[]>();
	for (const rec of recommendations) {
		const list = vendorGroups.get(rec.supplier) ?? [];
		list.push(rec);
		vendorGroups.set(rec.supplier, list);
	}

	const crossItemVendors: CrossItemVendor[] = [...vendorGroups.entries()]
		.filter(([, products]) => products.length > 1)
		.map(([supplier, products]) => ({
			supplier,
			supplierId: products[0].supplierId,
			products,
			average: Number(
				(products.reduce((sum, p) => sum + p.score, 0) / products.length).toFixed(1)
			),
			familiesCovered: Array.from(new Set(products.map((p) => p.family)))
		}))
		.sort((a, b) => b.products.length - a.products.length)
		.slice(0, 5);

	const creditEstimate = calculateCreditEstimate({
		totalProducts: rfqItems.length,
		familyCount: families.length,
		pagesPerFamily: 1,
		stealthProxy: false
	});

	return {
		runDate: '2026-11-22',
		sourceLabel: SOURCE_CONSOLIDATED,
		catalogName: 'products.xlsx',
		config: structuredClone(DEFAULT_PIPELINE_CONFIG),
		rfqItems,
		families,
		recommendations,
		disqualified: [],
		crossItemVendors,
		creditEstimate,
		cache
	};
}
