<script lang="ts">
	import type { ProductFamily } from '$lib/types/sourcing';

	interface Props {
		families: ProductFamily[];
		totalProducts: number;
	}

	let { families, totalProducts }: Props = $props();

	let maxCount = $derived(Math.max(1, ...families.map((f) => f.itemCount)));
</script>

<article class="panel family-panel" id="families">
	<div class="panel-heading">
		<div>
			<h2>Product families</h2>
			<p>{totalProducts} products grouped to reduce repeated Alibaba searches</p>
		</div>
		<span class="panel-total">{families.length} families</span>
	</div>

	<div class="family-list">
		{#each families as family, index (family.familyId)}
			<div class="family-row" title={`${family.familyId}: ${family.searchQuery} (cohesion ${family.cohesionScore}%)`}>
				<span class="family-color" style={`background: var(--family-${index % 5});`}></span>
				<span class="family-name">{family.name}</span>
				<div class="family-track">
					<span
						style={`width: ${(family.itemCount / maxCount) * 100}%; background: var(--family-${index % 5});`}
					></span>
				</div>
				<span class="family-count">{family.itemCount}</span>
			</div>
		{/each}
	</div>

	<div class="chart-caption">
		<span><i class="legend-dot"></i>Products assigned</span>
		<span>{maxCount} items max / family</span>
	</div>
</article>
