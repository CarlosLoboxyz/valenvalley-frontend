<script lang="ts">
	import type { ProductFamily, RecommendationItem } from '$lib/types/sourcing';
	import FamilyCoverageChart from './FamilyCoverageChart.svelte';
	import ScoreDistributionChart from './ScoreDistributionChart.svelte';

	interface Props {
		items: RecommendationItem[];
		families: ProductFamily[];
		average: string;
		onSelect: (item: RecommendationItem) => void;
	}

	let { items, families, average, onSelect }: Props = $props();
</script>

<div class="charts-grid">
	<FamilyCoverageChart {families} totalProducts={items.length} />
	<ScoreDistributionChart {items} {average} {onSelect} />
</div>
