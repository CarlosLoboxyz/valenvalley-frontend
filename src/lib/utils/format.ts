import type { RecommendationTier } from '$lib/types/sourcing';

export function padPosition(pos: number): string {
	return String(pos).padStart(2, '0');
}

export function classifyTier(score: number): RecommendationTier {
	if (score >= 75) return 'Strong Recommend';
	if (score >= 55) return 'Consider';
	return 'Caution';
}

/** Tono de Badge para un nivel de recomendación. */
export function tierTone(tier: RecommendationTier): 'strong' | 'good' | 'warn' {
	if (tier === 'Strong Recommend') return 'strong';
	if (tier === 'Consider') return 'good';
	return 'warn';
}

/** Tono de Badge para un puntaje numérico (mismos umbrales que la tabla). */
export function scoreTone(score: number): 'strong' | 'good' | 'warn' {
	if (score >= 75) return 'strong';
	if (score >= 52) return 'good';
	return 'warn';
}

export function normalizeQueryKey(query: string): string {
	return query
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function parsePriceRange(priceStr: string): { min: number | null; max: number | null } {
	const matches = priceStr.match(/\d+(?:\.\d+)?/g);
	if (!matches || matches.length === 0) return { min: null, max: null };
	const nums = matches.map(Number).filter((n) => Number.isFinite(n));
	if (nums.length === 0) return { min: null, max: null };
	if (nums.length === 1) return { min: nums[0], max: nums[0] };
	return { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) };
}

export function formatBudgetRange(min: number | null, max: number | null): string {
	if (min !== null && max !== null) {
		return `$${min.toFixed(2)}–$${max.toFixed(2)}`;
	}
	if (max !== null) return `≤ $${max.toFixed(2)}`;
	if (min !== null) return `≥ $${min.toFixed(2)}`;
	return 'Not specified';
}
