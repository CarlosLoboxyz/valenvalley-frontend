<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import type { RecommendationItem } from '$lib/types/sourcing';

	interface Props {
		items: RecommendationItem[];
		average: string;
		onSelect: (item: RecommendationItem) => void;
	}

	let { items, average, onSelect }: Props = $props();

	const { t, score } = usePreferences();
</script>

<Card variant="panel" class="score-panel">
	<div class="panel-heading">
		<div>
			<h2>{t('graphs.scores.title')}</h2>
			<p>{t('graphs.scores.subtitle')}</p>
		</div>
		<span class="score-average">{t('graphs.scores.avg')} <b>{score(Number(average))}</b></span>
	</div>

	<div class="score-bars">
		{#each items as item (item.pos)}
			<button
				type="button"
				class="score-bar-column"
				title={t('graphs.scores.bar', { product: item.product, score: score(item.score) })}
				aria-label={t('graphs.scores.barAria', { product: item.product, score: score(item.score) })}
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
		<span><i class="legend-dot warn"></i>{t('graphs.scores.legendCaution')}</span>
		<span><i class="legend-dot green-dot"></i>{t('graphs.scores.legendConsider')}</span>
		<span>{t('graphs.scores.axis')}</span>
		<Icon name="shield-alert" size={14} />
	</div>
</Card>
