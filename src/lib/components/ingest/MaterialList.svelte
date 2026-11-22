<script lang="ts">
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import type { ManualItem } from '$lib/schemas/materials';
	import { usePreferences } from '$lib/stores/preferences.svelte';

	let { items, onRemove }: { items: ManualItem[]; onRemove: (id: string) => void } = $props();

	const { t, n, unit } = usePreferences();
</script>

{#if items.length === 0}
	<p class="material-empty">{t('ingest.list.empty')}</p>
{:else}
	<ul class="material-list">
		{#each items as item (item.id)}
			<li class="material-item">
				<span class="material-item__name">{item.name}</span>
				<span class="material-item__qty"><b>{n(item.qty)}</b> {unit(item.unit)}</span>
				<IconButton
					icon="x"
					tone="danger"
					bordered
					small
					iconSize={14}
					label={t('ingest.list.remove', { name: item.name })}
					onclick={() => onRemove(item.id)}
				/>
			</li>
		{/each}
	</ul>
{/if}
