import type { CreditEstimate, Granularity } from '$lib/types/sourcing';

export const PREMIUM_CREDITS_PER_PAGE = 30; // 25 JS + premium proxy + 5 ai_extract_rules
export const STEALTH_CREDITS_PER_PAGE = 80; // 75 stealth proxy + 5 ai_extract_rules

export function calculateCreditEstimate(params: {
	totalProducts: number;
	familyCount: number;
	pagesPerFamily: number;
	stealthProxy: boolean;
}): CreditEstimate {
	const totalProducts = Math.max(0, params.totalProducts);
	const familyCount = Math.max(0, params.familyCount);
	const pages = Math.max(1, params.pagesPerFamily);
	const creditsPerPage = params.stealthProxy ? STEALTH_CREDITS_PER_PAGE : PREMIUM_CREDITS_PER_PAGE;

	const estimatedCredits = familyCount * pages * creditsPerPage;
	const ungroupedCredits = totalProducts * pages * creditsPerPage;
	const creditsSaved = Math.max(0, ungroupedCredits - estimatedCredits);
	const apiCallReductionPct =
		totalProducts > 0 ? Math.round(((totalProducts - familyCount) / totalProducts) * 100) : 0;

	return {
		totalProducts,
		familyCount,
		apiCallReductionPct,
		creditsPerPage,
		estimatedCredits,
		ungroupedCredits,
		creditsSaved,
		proxyMode: params.stealthProxy ? 'stealth' : 'premium'
	};
}

export interface BenchmarkRow {
	label: string;
	granularity: Granularity | 'ungrouped';
	families: number;
	reductionPct: number;
	premiumCredits: number;
	stealthCredits: number;
}

export const CATALOG_100_BENCHMARKS: BenchmarkRow[] = [
	{
		label: 'Ungrouped baseline',
		granularity: 'ungrouped',
		families: 100,
		reductionPct: 0,
		premiumCredits: 3000,
		stealthCredits: 8000
	},
	{
		label: 'fine',
		granularity: 'fine',
		families: 51,
		reductionPct: 49,
		premiumCredits: 1530,
		stealthCredits: 4080
	},
	{
		label: 'balanced (default)',
		granularity: 'balanced',
		families: 42,
		reductionPct: 58,
		premiumCredits: 1260,
		stealthCredits: 3360
	},
	{
		label: 'broad',
		granularity: 'broad',
		families: 33,
		reductionPct: 67,
		premiumCredits: 990,
		stealthCredits: 2640
	}
];
