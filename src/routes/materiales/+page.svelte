<script lang="ts">
	import { goto } from '$app/navigation';
	import FileDropzone from '$lib/components/ingest/FileDropzone.svelte';
	import IngestReport from '$lib/components/ingest/IngestReport.svelte';
	import ManualEntry from '$lib/components/ingest/ManualEntry.svelte';
	import MaterialList from '$lib/components/ingest/MaterialList.svelte';
	import AuthShell from '$lib/components/shell/AuthShell.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import { materialsStore } from '$lib/stores/materials.svelte';

	const { t, n } = usePreferences();

	function onContinue() {
		// Navegación al siguiente paso de la ingesta (hitos posteriores).
		if (materialsStore.canContinue) void goto('/');
	}
</script>

<svelte:head>
	<title>{t('ingest.meta.title')}</title>
	<meta name="description" content={t('ingest.meta.description')} />
</svelte:head>

<AuthShell title={t('ingest.title')} subtitle={t('ingest.subtitle')} wide>
	<FileDropzone onParsed={(report) => materialsStore.setFileReport(report)} />

	{#if materialsStore.file}
		<IngestReport file={materialsStore.file} />
	{/if}

	<div class="separator">{t('ingest.or')}</div>

	<ManualEntry onAdd={(item) => materialsStore.addItem(item)} />

	<MaterialList
		items={materialsStore.manualItems}
		onRemove={(id) => materialsStore.removeItem(id)}
	/>

	<div class="cta-row">
		<Button size="lg" block disabled={!materialsStore.canContinue} onclick={onContinue}>
			{t('ingest.cta')}
			{#if materialsStore.canContinue}
				{t('ingest.cta.counts', {
					manual: materialsStore.manualCount,
					file: materialsStore.file?.validCount ?? 0
				})}
			{/if}
		</Button>
	</div>

	{#snippet footer()}
		{t('ingest.foot', { units: n(materialsStore.totalUnits) })}
	{/snippet}
</AuthShell>
