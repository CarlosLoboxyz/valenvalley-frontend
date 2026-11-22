<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import type { ProductFamily } from '$lib/types/sourcing';

	interface Props {
		families: ProductFamily[];
		totalProducts: number;
	}

	let { families, totalProducts }: Props = $props();

	const { t, tn } = usePreferences();

	const maxCount = $derived(Math.max(1, ...families.map((f) => f.itemCount)));
</script>

<Card variant="panel" class="family-panel" id="families">
	<div class="panel-heading">
		<div>
			<h2>{t('graphs.families.title')}</h2>
			<p>{tn('graphs.families.subtitle', totalProducts)}</p>
		</div>
		<span class="panel-total">{tn('graphs.families.total', families.length)}</span>
	</div>

	<div class="family-list">
		{#each families as family, index (family.familyId)}
			<div
				class="family-row"
				title={t('graphs.families.tooltip', {
					id: family.familyId,
					query: family.searchQuery,
					cohesion: family.cohesionScore
				})}
			>
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
		<span><i class="legend-dot"></i>{t('graphs.families.assigned')}</span>
		<span>{t('graphs.families.max', { count: maxCount })}</span>
	</div>
</Card>
