<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { CreditEstimate } from '$lib/types/sourcing';

	interface Props {
		creditEstimate: CreditEstimate;
		averageScore: string;
	}

	let { creditEstimate, averageScore }: Props = $props();

	let avgNumeric = $derived(Number(averageScore));
</script>

<div class="stat-grid">
	<article class="stat-card">
		<div class="stat-top">
			Products analyzed
			<span class="stat-icon">
				<Icon name="shopping-bag" size={16} />
			</span>
		</div>
		<div class="stat-value">
			{creditEstimate.totalProducts} <span class="stat-unit">products</span>
		</div>
		<div class="stat-foot">Across {creditEstimate.familyCount} product families</div>
	</article>

	<article class="stat-card">
		<div class="stat-top">
			Search efficiency
			<span class="stat-icon">
				<Icon name="zap" size={16} />
			</span>
		</div>
		<div class="stat-value">
			{creditEstimate.apiCallReductionPct}<span class="percent">%</span>
			<span class="trend"><Icon name="arrow-up-right" size={14} /> saved</span>
		</div>
		<div class="stat-foot">
			{creditEstimate.familyCount} searches instead of {creditEstimate.totalProducts}
		</div>
	</article>

	<article class="stat-card">
		<div class="stat-top">
			Estimated scrape cost
			<span class="stat-icon">
				<Icon name="sparkles" size={16} />
			</span>
		</div>
		<div class="stat-value">
			{creditEstimate.estimatedCredits} <span class="stat-unit">credits</span>
		</div>
		<div class="stat-foot">
			~{creditEstimate.creditsSaved} credits saved vs. ungrouped ({creditEstimate.proxyMode})
		</div>
	</article>

	<article class="stat-card">
		<div class="stat-top">
			Average match score
			<span class="stat-icon">
				<Icon name="shield-alert" size={16} />
			</span>
		</div>
		<div class="stat-value">
			{averageScore}<span class="out-of"> / 100</span>
		</div>
		<div class="stat-foot">
			<span class="status-pill" class:good={avgNumeric >= 55}>
				{avgNumeric >= 75
					? 'Strong match'
					: avgNumeric >= 55
						? 'Consider shortlist'
						: 'Review recommended'}
			</span>
		</div>
	</article>
</div>
