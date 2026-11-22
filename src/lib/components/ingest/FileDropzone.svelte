<script lang="ts">
	import Alert from '$lib/components/ui/Alert.svelte';
	import { parseMaterialsData } from '$lib/services/file-ingest';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import type { FileIngestState } from '$lib/stores/materials.svelte';

	let { onParsed }: { onParsed: (report: FileIngestState) => void } = $props();

	const { t } = usePreferences();

	let dragging = $state(false);
	let error = $state<string | null>(null);
	let processing = $state(false);
	let input: HTMLInputElement | undefined = $state();

	const ACCEPT =
		'.csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

	async function handleFile(file: File) {
		error = null;
		if (!/\.(csv|xlsx)$/i.test(file.name)) {
			error = t('ingest.onlyCsvXlsx');
			return;
		}
		processing = true;
		try {
			const result = parseMaterialsData(await file.arrayBuffer());
			onParsed({ fileName: file.name, validCount: result.valid.length, errors: result.errors });
		} catch {
			error = t('ingest.readFailed');
		} finally {
			processing = false;
		}
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		const file = event.dataTransfer?.files?.[0];
		if (file) void handleFile(file);
	}

	function onSelect(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const file = target.files?.[0];
		if (file) void handleFile(file);
		target.value = '';
	}

	function onDragOver(event: DragEvent) {
		event.preventDefault();
		dragging = true;
	}
</script>

<div class="field">
	<span class="field__label">{t('ingest.file.label')}</span>
	<div
		class="dropzone"
		class:is-dragging={dragging}
		role="button"
		tabindex="0"
		aria-label={t('ingest.dropzone.aria')}
		onclick={() => input?.click()}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && input?.click()}
		ondragover={onDragOver}
		ondragleave={() => (dragging = false)}
		ondrop={onDrop}
	>
		<span class="dropzone__title">
			{processing ? t('ingest.dropzone.reading') : t('ingest.dropzone.title')}
		</span>
		<span class="dropzone__hint">{t('ingest.dropzone.hint')}</span>
		<input accept={ACCEPT} bind:this={input} type="file" class="sr-only" onchange={onSelect} />
	</div>
	{#if error}
		<Alert tone="error">{error}</Alert>
	{/if}
</div>
