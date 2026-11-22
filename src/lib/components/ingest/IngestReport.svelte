<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import { UNIT_VALUES } from '$lib/schemas/materials';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import type { FileIngestState } from '$lib/stores/materials.svelte';

	let { file }: { file: FileIngestState } = $props();

	const { t, msg, n } = usePreferences();

	const unitList = UNIT_VALUES.join(', ');
</script>

<div class="ingest-report">
	<Card variant="plain" class="ingest-report__card" hover={false}>
		<h3>{t('ingest.report.valid')}</h3>
		<p class="ingest-report__count is-ok">{n(file.validCount)}</p>
		<p class="ingest-report__note">{file.fileName}</p>
	</Card>

	<Card variant="plain" class="ingest-report__card" hover={false}>
		<h3>{t('ingest.report.errors')}</h3>
		<p class="ingest-report__count is-bad">{n(file.errors.length)}</p>
		{#if file.errors.length > 0}
			<ul class="ingest-report__list">
				{#each file.errors as err, index (`${err.row}-${err.column}-${index}`)}
					<li>
						<span class="row-chip">{t('ingest.report.row', { row: err.row })}</span>
						{#if err.column}<span class="row-chip">{err.column}</span>{/if}
						{msg(err.message, { ...err.params, units: unitList })}
					</li>
				{/each}
			</ul>
		{:else}
			<p class="ingest-report__note">{t('ingest.report.none')}</p>
		{/if}
	</Card>
</div>
