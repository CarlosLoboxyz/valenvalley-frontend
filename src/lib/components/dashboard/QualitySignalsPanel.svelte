<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { MessageKey } from '$lib/i18n';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import type { QualitySignal } from '$lib/types/sourcing';

	interface Props {
		signals: QualitySignal[];
	}

	let { signals }: Props = $props();

	const { t } = usePreferences();

	type SignalId = QualitySignal['id'];

	const titles = {
		moq: 'quality.moq.title',
		brand: 'quality.brand.title',
		price: 'quality.price.title',
		tenure: 'quality.tenure.title'
	} as const satisfies Record<SignalId, MessageKey>;

	const whenAffected = {
		moq: 'quality.moq.some',
		brand: 'quality.brand.some',
		price: 'quality.price.some',
		tenure: 'quality.tenure.some'
	} as const satisfies Record<SignalId, MessageKey>;

	const whenClear = {
		moq: 'quality.moq.none',
		brand: 'quality.brand.none',
		price: 'quality.price.none',
		tenure: 'quality.tenure.none'
	} as const satisfies Record<SignalId, MessageKey>;

	const severities = {
		HIGH: 'quality.severity.HIGH',
		CHECK: 'quality.severity.CHECK'
	} as const satisfies Record<QualitySignal['severity'], MessageKey>;
</script>

<Card variant="panel" class="quality-panel">
	<div class="panel-heading">
		<div>
			<h2>{t('quality.title')}</h2>
			<p>{t('quality.subtitle')}</p>
		</div>
		<Icon name="shield-alert" size={17} color="var(--primary)" />
	</div>

	{#each signals as signal (signal.id)}
		<div class="quality-row">
			<span class="quality-marker" class:high={signal.severity === 'HIGH'}></span>
			<div>
				<b>{t(titles[signal.id])}</b>
				<small>
					{signal.count > 0
						? t(whenAffected[signal.id], { count: signal.count, total: signal.total })
						: t(whenClear[signal.id])}
				</small>
			</div>
			<span class="quality-label">{t(severities[signal.severity])}</span>
		</div>
	{/each}
</Card>
