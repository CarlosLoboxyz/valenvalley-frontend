import type { Granularity, ProductFamily, RfqItem } from '$lib/types/sourcing';

const GENERIC_MODIFIERS = new Set([
	'heavy',
	'duty',
	'professional',
	'pro',
	'industrial',
	'commercial',
	'standard',
	'premium',
	'deluxe',
	'universal',
	'multi',
	'purpose',
	'ergonomic',
	'compact',
	'portable',
	'cordless',
	'corded',
	'electric',
	'manual',
	'automatic',
	'adjustable',
	'aluminum',
	'steel',
	'stainless',
	'plastic',
	'rubber',
	'chrome',
	'carbon',
	'alloy',
	'piece',
	'pcs',
	'set',
	'kit',
	'inch',
	'oz',
	'ft',
	'mm',
	'cm',
	'drive',
	'oem',
	'generic',
	'similar',
	'or',
	'and',
	'the',
	'with',
	'for',
	'of',
	'in',
	'to',
	'a',
	'an'
]);

const GRANULARITY_THRESHOLDS: Record<Granularity, { stage1: number; stage2: number }> = {
	fine: { stage1: 0.72, stage2: 0.62 },
	balanced: { stage1: 0.56, stage2: 0.45 },
	broad: { stage1: 0.38, stage2: 0.30 }
};

interface ProductFeatures {
	item: RfqItem;
	headNoun: string;
	headBigram: string;
	corePhraseTokens: Set<string>;
	specKeys: Set<string>;
	contextTokens: Set<string>;
	midPrice: number | null;
}

function stripParentheticalsAndClauses(text: string): string {
	let cleaned = text.replace(/\([^)]*\)/g, ' ');
	cleaned = cleaned.replace(/\b(?:for|with|compatible with|fits)\b.*$/i, ' ');
	return cleaned;
}

function tokenizeContent(text: string, brandWords: Set<string>): string[] {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, ' ')
		.split(/[\s-]+/)
		.map((t) => t.trim())
		.filter((t) => {
			if (!t || t.length < 2) return false;
			if (/\d/.test(t)) return false; // drop digit/model tokens
			if (GENERIC_MODIFIERS.has(t)) return false;
			if (brandWords.has(t)) return false;
			return true;
		});
}

function singularize(word: string): string {
	if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
	if (word.endsWith('es') && /(?:ch|sh|x|s|z)es$/.test(word)) return word.slice(0, -2);
	if (word.endsWith('s') && !word.endsWith('ss') && word !== 'pliers' && word.length > 3) {
		return word.slice(0, -1);
	}
	return word;
}

function extractFeatures(items: RfqItem[]): ProductFeatures[] {
	const brandWords = new Set<string>();
	for (const item of items) {
		for (const token of item.brand.toLowerCase().split(/[^a-z0-9]+/)) {
			if (token.length >= 3 && !GENERIC_MODIFIERS.has(token)) {
				brandWords.add(token);
			}
		}
	}

	return items.map((item) => {
		const stripped = stripParentheticalsAndClauses(item.name);
		const coreTokens = tokenizeContent(stripped, brandWords).map(singularize);
		const headNoun = coreTokens[coreTokens.length - 1] ?? item.name.toLowerCase().trim();
		const headBigram =
			coreTokens.length >= 2
				? `${coreTokens[coreTokens.length - 2]} ${headNoun}`
				: headNoun;

		const specKeys = new Set(
			Object.keys(item.technicalSpecs).map((k) => k.toLowerCase().trim()).filter(Boolean)
		);

		const contextTokens = new Set(
			tokenizeContent(`${item.name} ${item.description}`, brandWords).map(singularize)
		);

		const midPrice =
			item.minPrice !== null && item.maxPrice !== null
				? (item.minPrice + item.maxPrice) / 2
				: item.maxPrice ?? item.minPrice;

		return {
			item,
			headNoun,
			headBigram,
			corePhraseTokens: new Set(coreTokens),
			specKeys,
			contextTokens,
			midPrice
		};
	});
}

function jaccard(a: Set<string>, b: Set<string>): number {
	if (a.size === 0 && b.size === 0) return 0;
	let intersection = 0;
	for (const token of a) {
		if (b.has(token)) intersection++;
	}
	const union = a.size + b.size - intersection;
	return union === 0 ? 0 : intersection / union;
}

function computeFiveViewSimilarity(a: ProductFeatures, b: ProductFeatures): number {
	// View 1: Terminal Head Noun (0.38)
	const v1 = a.headNoun === b.headNoun ? 1 : 0;
	// View 2: Head Bigram (0.18)
	const v2 = a.headBigram === b.headBigram ? 1 : 0;
	// View 3: Core Stripped Product Phrase (0.20)
	const v3 = jaccard(a.corePhraseTokens, b.corePhraseTokens);
	// View 4: JSON Spec-Key Schema (0.12)
	const v4 = jaccard(a.specKeys, b.specKeys);
	// View 5: Cleaned Name + Description Context (0.12)
	const v5 = jaccard(a.contextTokens, b.contextTokens);

	let sim = 0.38 * v1 + 0.18 * v2 + 0.2 * v3 + 0.12 * v4 + 0.12 * v5;

	// Soft log-price damping when unit prices differ by > 4.5x
	if (a.midPrice && b.midPrice && a.midPrice > 0 && b.midPrice > 0) {
		const ratio = Math.max(a.midPrice, b.midPrice) / Math.min(a.midPrice, b.midPrice);
		if (ratio > 4.5) {
			const damping = 1 / (1 + Math.log(ratio / 4.5));
			sim *= damping;
		}
	}

	return sim;
}

function titleCase(str: string): string {
	return str
		.split(/\s+/)
		.filter(Boolean)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(' ');
}

function synthesizeFamilyMetadata(
	clusterIndices: number[],
	features: ProductFeatures[],
	simMatrix: number[][]
): { name: string; searchQuery: string; cohesionScore: number; avgPrice: number | null } {
	const headCounts = new Map<string, number>();
	const tokenCounts = new Map<string, number>();

	for (const idx of clusterIndices) {
		const f = features[idx];
		headCounts.set(f.headNoun, (headCounts.get(f.headNoun) ?? 0) + 1);
		for (const tok of f.corePhraseTokens) {
			tokenCounts.set(tok, (tokenCounts.get(tok) ?? 0) + 1);
		}
	}

	const sortedHeads = [...headCounts.entries()].sort((a, b) => b[1] - a[1]);
	const dominantHead = sortedHeads[0]?.[0] ?? 'product';

	const highCoverageTokens = [...tokenCounts.entries()]
		.filter(([, count]) => count >= Math.ceil(clusterIndices.length * 0.6))
		.sort((a, b) => b[1] - a[1])
		.map(([t]) => t)
		.slice(0, 3);

	const namePhrase =
		highCoverageTokens.length > 0 && highCoverageTokens.includes(dominantHead)
			? highCoverageTokens.join(' ')
			: dominantHead;

	const searchQuery = `${namePhrase} wholesale supplier`;

	// Internal cohesion score (0–100%)
	let cohesionScore = 100;
	if (clusterIndices.length > 1) {
		let sum = 0;
		let pairs = 0;
		for (let i = 0; i < clusterIndices.length; i++) {
			for (let j = i + 1; j < clusterIndices.length; j++) {
				sum += simMatrix[clusterIndices[i]][clusterIndices[j]];
				pairs++;
			}
		}
		cohesionScore = pairs > 0 ? Math.round((sum / pairs) * 100) : 100;
	}

	const prices = clusterIndices
		.map((idx) => features[idx].midPrice)
		.filter((p): p is number => p !== null && Number.isFinite(p));
	const avgPrice =
		prices.length > 0 ? Number((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)) : null;

	return {
		name: titleCase(namePhrase),
		searchQuery,
		cohesionScore,
		avgPrice
	};
}

/**
 * Domain-agnostic, zero-LLM 5-view two-stage agglomerative clustering engine.
 * Direct TypeScript port of `scripts/dynamic_family_grouper.py`.
 */
export function groupProductsIntoFamilies(
	items: RfqItem[],
	granularity: Granularity = 'balanced'
): { families: ProductFamily[]; positionToFamily: Map<number, ProductFamily> } {
	if (items.length === 0) {
		return { families: [], positionToFamily: new Map() };
	}

	const features = extractFeatures(items);
	const n = features.length;
	const simMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

	for (let i = 0; i < n; i++) {
		simMatrix[i][i] = 1;
		for (let j = i + 1; j < n; j++) {
			const sim = computeFiveViewSimilarity(features[i], features[j]);
			simMatrix[i][j] = sim;
			simMatrix[j][i] = sim;
		}
	}

	const { stage1, stage2 } = GRANULARITY_THRESHOLDS[granularity];

	// Two-stage average-linkage agglomerative clustering
	let clusters: number[][] = Array.from({ length: n }, (_, i) => [i]);

	const runMergeStage = (threshold: number) => {
		let merged = true;
		while (merged && clusters.length > 1) {
			merged = false;
			let bestSim = -1;
			let bestA = -1;
			let bestB = -1;

			for (let i = 0; i < clusters.length; i++) {
				for (let j = i + 1; j < clusters.length; j++) {
					let sum = 0;
					let count = 0;
					for (const idxA of clusters[i]) {
						for (const idxB of clusters[j]) {
							sum += simMatrix[idxA][idxB];
							count++;
						}
					}
					const avgSim = count > 0 ? sum / count : 0;
					if (avgSim > bestSim) {
						bestSim = avgSim;
						bestA = i;
						bestB = j;
					}
				}
			}

			if (bestSim >= threshold && bestA !== -1 && bestB !== -1) {
				clusters[bestA] = [...clusters[bestA], ...clusters[bestB]];
				clusters.splice(bestB, 1);
				merged = true;
			}
		}
	};

	// Stage 1: Tight core families
	runMergeStage(stage1);
	// Stage 2: Secondary merge without chaining unrelated singletons
	runMergeStage(stage2);

	// Sort clusters by size desc, then lowest position asc
	clusters.sort((a, b) => {
		if (b.length !== a.length) return b.length - a.length;
		return features[a[0]].item.position - features[b[0]].item.position;
	});

	const families: ProductFamily[] = [];
	const positionToFamily = new Map<number, ProductFamily>();

	clusters.forEach((indices, idx) => {
		const familyId = `FAM_${String(idx + 1).padStart(2, '0')}`;
		const meta = synthesizeFamilyMetadata(indices, features, simMatrix);
		const positions = indices.map((i) => features[i].item.position).sort((a, b) => a - b);

		const family: ProductFamily = {
			familyId,
			name: meta.name,
			searchQuery: meta.searchQuery,
			cohesionScore: meta.cohesionScore,
			positions,
			itemCount: positions.length,
			avgPrice: meta.avgPrice
		};

		families.push(family);
		for (const pos of positions) {
			positionToFamily.set(pos, family);
		}
	});

	return { families, positionToFamily };
}
