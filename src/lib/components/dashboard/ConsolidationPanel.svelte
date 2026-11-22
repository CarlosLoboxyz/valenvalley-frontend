<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { CrossItemVendor, RecommendationItem } from '$lib/types/sourcing';
	import { formatScore, padPosition, tierClass } from '$lib/utils/format';

	interface Props {
		vendors: CrossItemVendor[];
		expandedSupplier: string | null;
		onToggleSupplier: (supplier: string) => void;
		onInspectProduct: (item: RecommendationItem) => void;
	}

	let { vendors, expandedSupplier, onToggleSupplier, onInspectProduct }: Props = $props();
</script>

<article class="panel supplier-panel" id="suppliers">
	<div class="panel-heading">
		<div>
			<h2>Consolidation opportunities</h2>
			<p>Top multi-item vendors · potential shipment consolidation</p>
		</div>
		<span class="panel-total">{vendors.length} providers</span>
	</div>

	{#if vendors.length === 0}
		<div class="empty-state">No multi-item suppliers match the current filter set.</div>
	{:else}
		<div class="vendor-table">
			<div class="vendor-head">
				<span>PROVIDER</span>
				<span>PRODUCTS</span>
				<span>AVG SCORE</span>
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
					<span class="coverage"><b>{group.products.length}</b> items</span>
					<span
						class={`score-chip ${group.average >= 75 ? 'strong' : group.average >= 55 ? 'consider' : ''}`}
					>
						{formatScore(group.average)}
					</span>
				</button>

				{#if expandedSupplier === group.supplier}
					<div class="vendor-details">
						<b>Products assigned to this provider ({group.familiesCovered.join(', ')})</b>
						{#each group.products as item (item.pos)}
							<div class="vendor-product">
								<span class="product-number">{padPosition(item.pos)}</span>
								<span>
									{item.product}
									<small>{item.family} · {item.qty}</small>
								</span>
								<button
									type="button"
									class={`score-chip ${tierClass(item.tier)}`}
									style="border:0;cursor:pointer;"
									onclick={() => onInspectProduct(item)}
									title="Inspect score breakdown"
								>
									{formatScore(item.score)}
								</button>
							</div>
						{/each}
					</div>
				{/if}
			{/each}
		</div>
	{/if}

	<div class="panel-note">
		<Icon name="truck" size={14} />
		Expand a provider to see its assigned product positions, families, and quantities.
	</div>
</article>
