<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import type { CrossItemVendor, RecommendationItem } from '$lib/types/sourcing';
	import { padPosition, scoreTone, tierTone } from '$lib/utils/format';

	interface Props {
		vendors: CrossItemVendor[];
		expandedSupplier: string | null;
		onToggleSupplier: (supplier: string) => void;
		onInspectProduct: (item: RecommendationItem) => void;
	}

	let { vendors, expandedSupplier, onToggleSupplier, onInspectProduct }: Props = $props();

	const { t, tn, n, score, qty } = usePreferences();
</script>

<Card variant="panel" class="supplier-panel" id="suppliers">
	<div class="panel-heading">
		<div>
			<h2>{t('consolidation.title')}</h2>
			<p>{t('consolidation.subtitle')}</p>
		</div>
		<span class="panel-total">{tn('consolidation.total', vendors.length)}</span>
	</div>

	{#if vendors.length === 0}
		<EmptyState icon="truck">{t('consolidation.empty')}</EmptyState>
	{:else}
		<div class="vendor-table">
			<div class="vendor-head">
				<span>{t('consolidation.col.provider')}</span>
				<span>{t('consolidation.col.products')}</span>
				<span>{t('consolidation.col.avg')}</span>
			</div>

			{#each vendors as group (group.supplier)}
				<button
					type="button"
					class="vendor-row"
					aria-expanded={expandedSupplier === group.supplier}
					onclick={() => onToggleSupplier(group.supplier)}
				>
					<span class="vendor-name">
						<span class="vendor-avatar">{group.supplier.slice(0, 1)}</span>
						<span>{group.supplier}</span>
					</span>
					<span class="coverage">
						<b>{n(group.products.length)}</b>
						{tn('common.itemsWord', group.products.length)}
					</span>
					<Badge tone={scoreTone(group.average)} class="vendor-score">
						{score(group.average)}
					</Badge>
				</button>

				{#if expandedSupplier === group.supplier}
					<div class="vendor-details">
						<b>{t('consolidation.expanded', { families: group.familiesCovered.join(', ') })}</b>
						{#each group.products as item (item.pos)}
							<div class="vendor-product">
								<span class="product-number">{padPosition(item.pos)}</span>
								<span>
									{item.product}
									<small>{item.family} · {qty(item.qtyNumeric, item.unit)}</small>
								</span>
								<Badge
									tone={tierTone(item.tier)}
									title={t('consolidation.inspect')}
									onclick={() => onInspectProduct(item)}
								>
									{score(item.score)}
								</Badge>
							</div>
						{/each}
					</div>
				{/if}
			{/each}
		</div>
	{/if}

	<div class="panel-note">
		<Icon name="truck" size={14} />
		{t('consolidation.note')}
	</div>
</Card>
