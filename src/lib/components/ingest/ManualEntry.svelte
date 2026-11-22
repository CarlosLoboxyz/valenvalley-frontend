<script lang="ts">
	import Alert from '$lib/components/ui/Alert.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { UNIT_VALUES, manualItemSchema, type ManualItem } from '$lib/schemas/materials';
	import { tryAddManualItem } from '$lib/services/manual-list';
	import { usePreferences } from '$lib/stores/preferences.svelte';

	let { onAdd }: { onAdd: (item: ManualItem) => void } = $props();

	const { t, msg } = usePreferences();

	let name = $state('');
	let qtyUnit = $state('');
	let error = $state<string | null>(null);

	function submit(): void {
		error = null;
		const resolved = tryAddManualItem(name, qtyUnit);
		if (!resolved.ok) {
			error = msg(resolved.error);
			return;
		}

		const check = manualItemSchema.safeParse({ id: crypto.randomUUID(), ...resolved });
		if (!check.success) {
			error = check.error.issues
				.map((issue) => msg(issue.message, { units: UNIT_VALUES.join(', ') }))
				.join(' · ');
			return;
		}

		onAdd(check.data);
		name = '';
		qtyUnit = '';
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			submit();
		}
	}
</script>

<div class="manual-row">
	<Field label={t('ingest.manual.material')} id="manual-material">
		{#snippet children({ id })}
			<Input
				{id}
				placeholder={t('ingest.manual.materialPlaceholder')}
				bind:value={name}
				onkeydown={onKeydown}
			/>
		{/snippet}
	</Field>

	<Field label={t('ingest.manual.qtyUnit')} id="manual-qty-unit">
		{#snippet children({ id })}
			<Input
				{id}
				placeholder={t('ingest.manual.qtyUnitPlaceholder')}
				bind:value={qtyUnit}
				onkeydown={onKeydown}
			/>
		{/snippet}
	</Field>

	<Button variant="navy" size="md" onclick={submit}>{t('ingest.manual.add')}</Button>
</div>

{#if error}
	<Alert tone="error" class="manual-error">{error}</Alert>
{/if}
