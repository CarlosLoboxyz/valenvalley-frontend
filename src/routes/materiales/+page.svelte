<script lang="ts">
	import { goto } from '$app/navigation';
	import FileDropzone from '$lib/components/ingest/FileDropzone.svelte';
	import IngestReport from '$lib/components/ingest/IngestReport.svelte';
	import ManualEntry from '$lib/components/ingest/ManualEntry.svelte';
	import MaterialList from '$lib/components/ingest/MaterialList.svelte';
	import ProgressStep from '$lib/components/onboarding/ProgressStep.svelte';
	import ReviewStep from '$lib/components/onboarding/ReviewStep.svelte';
	import Stepper from '$lib/components/onboarding/Stepper.svelte';
	import AuthShell from '$lib/components/shell/AuthShell.svelte';
	import UnavailableScreen from '$lib/components/shell/UnavailableScreen.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { materialsStore } from '$lib/stores/materials.svelte';
	import { OnboardingFlow } from '$lib/stores/onboarding.svelte';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const { t, msg, n } = usePreferences();

	// Un flujo por visita a la página (no un singleton de módulo).
	const flow = untrack(() =>
		data.status === 'ready'
			? new OnboardingFlow(
					data.pipeline,
					data.limits,
					{
						navigate: async (url) => {
							materialsStore.reset();
							await goto(url, { invalidateAll: true });
						},
						onUnauthorized: () => window.location.assign('/login?redirectTo=%2Fmateriales')
					},
					data.activeJob
				)
			: null
	);

	$effect(() => () => flow?.stopPolling());

	const title = $derived(
		!flow || flow.step === 'load'
			? t('onboarding.title.load')
			: flow.step === 'review'
				? t('onboarding.title.review')
				: flow.step === 'progress'
					? t('onboarding.title.progress')
					: t('onboarding.title.result')
	);
	const subtitle = $derived(
		!flow || flow.step === 'load'
			? t('onboarding.subtitle.load')
			: flow.step === 'review'
				? t('onboarding.subtitle.review')
				: flow.step === 'progress'
					? t('onboarding.subtitle.progress')
					: t('onboarding.subtitle.result')
	);

	function onContinue() {
		if (!flow || !materialsStore.canContinue) return;
		void flow.submitList(materialsStore.toRfqItems(), materialsStore.listName());
	}
</script>

<svelte:head>
	<title>{t('ingest.meta.title')}</title>
	<meta name="description" content={t('ingest.meta.description')} />
</svelte:head>

{#if data.status === 'unavailable' || !flow}
	<UnavailableScreen reason={data.status === 'unavailable' ? data.reason : 'backend_error'} />
{:else}
	<AuthShell {title} {subtitle} wide>
		<Stepper step={flow.step} />

		{#if flow.error}
			<Alert tone="error" class="flow-error">{t(flow.error.key, flow.error.params)}</Alert>
		{/if}

		{#if flow.step === 'load'}
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
				<Button
					size="lg"
					block
					disabled={!materialsStore.canContinue || flow.busy}
					onclick={onContinue}
				>
					{#if flow.busy}
						{t('onboarding.working')}
					{:else}
						{t('onboarding.load.cta')}
						{#if materialsStore.canContinue}
							{t('ingest.cta.counts', {
								manual: materialsStore.manualCount,
								file: materialsStore.file?.validCount ?? 0
							})}
						{/if}
					{/if}
				</Button>
			</div>
		{:else if flow.step === 'review'}
			<ReviewStep {flow} needsVerification={data.needsVerification} />
		{:else}
			<ProgressStep {flow} />
		{/if}

		{#snippet footer()}
			{#if flow.step === 'load'}
				{t('ingest.foot', { units: n(materialsStore.totalUnits) })}
				<br />
				<a href="/">{t('onboarding.toDashboard')}</a>
			{:else}
				{msg('onboarding.foot')}
			{/if}
		{/snippet}
	</AuthShell>
{/if}
