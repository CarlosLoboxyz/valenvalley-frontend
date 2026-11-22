<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { RecommendationItem } from '$lib/types/sourcing';
	import { formatScore } from '$lib/utils/format';

	interface Props {
		items: RecommendationItem[];
		average: string;
		onSelect: (item: RecommendationItem) => void;
	}

	let { items, average, onSelect }: Props = $props();
</script>

<article class="panel score-panel">
	<div class="panel-heading">
		<div>
			<h2>Recommendation scores</h2>
			<p>Top listing score per product · out of 100 (click any bar to inspect)</p>
		</div>
		<span class="score-average">AVG <b>{average}</b></span>
	</div>

	<div class="score-bars">
		{#each items as item (item.pos)}
			<button
				type="button"
				class="score-bar-column"
				title={`${item.product}: ${formatScore(item.score)}/100`}
				aria-label={`${item.product}, score ${formatScore(item.score)}`}
				onclick={() => onSelect(item)}
			>
				<span
					class="score-bar"
					style={`height: ${Math.min(100, Math.max(8, item.score))}%; background: ${item.score >= 52 ? 'var(--chart-2)' : 'var(--chart-1)'};`}
				></span>
				<span class="score-bar-label">{item.pos}</span>
			</button>
		{/each}
	</div>

	<div class="score-axis">
		<span>0</span>
		<span>25</span>
		<span>50</span>
		<span>75</span>
		<span>100</span>
	</div>

	<div class="chart-caption">
		<span><i class="legend-dot warn"></i>Caution (&lt;55)</span>
		<span><i class="legend-dot green-dot"></i>Consider / Strong (55+)</span>
		<span>Product position</span>
		<Icon name="shield-alert" size={14} />
	</div>
</article>
