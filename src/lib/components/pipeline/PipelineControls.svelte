<script lang="ts">
	import Alert from '$lib/components/ui/Alert.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import type { Granularity, PipelineConfig, StatusMessage } from '$lib/types/sourcing';

	interface Props {
		config: PipelineConfig;
		disqualifiedCount: number;
		status: StatusMessage | null;
		isBusy: boolean;
		onGranularityChange: (g: Granularity) => void;
		onValidate: () => void;
		onCompare: () => void;
		onGenerateRfq: () => void;
	}

	let {
		config = $bindable(),
		disqualifiedCount,
		status,
		isBusy,
		onGranularityChange,
		onValidate,
		onCompare,
		onGenerateRfq
	}: Props = $props();

	const { t, tn } = usePreferences();

	const certsInput = $derived(config.filters.requiredCerts.join(', '));

	function handleCertsChange(raw: string) {
		config.filters.requiredCerts = raw
			.split(',')
			.map((s) => s.trim().toUpperCase())
			.filter(Boolean);
	}
</script>

<div class="pipeline-grid">
	<Card variant="panel">
		<div class="panel-heading">
			<div>
				<h2>{t('pipeline.ingest.title')}</h2>
				<p>{t('pipeline.ingest.subtitle')}</p>
			</div>
			<span class="panel-total">{t(`pipeline.granularity.${config.granularity}` as const)}</span>
		</div>

		<div class="control-group">
			<div class="control-row">
				<div>
					<span class="control-label">{t('pipeline.import.label')}</span>
					<small>{t('pipeline.import.hint')}</small>
				</div>
				<Button variant="secondary" href="/materiales">
					<Icon name="upload" size={14} />
					{t('pipeline.import.button')}
				</Button>
			</div>

			<div class="control-row">
				<div>
					<span class="control-label" id="granularity-label">{t('pipeline.granularity.label')}</span>
					<small>{t('pipeline.granularity.hint')}</small>
				</div>
				<SegmentedControl
					size="sm"
					label={t('pipeline.granularity.label')}
					value={config.granularity}
					onchange={onGranularityChange}
					options={[
						{ value: 'fine', label: t('pipeline.granularity.fine') },
						{ value: 'balanced', label: t('pipeline.granularity.balanced') },
						{ value: 'broad', label: t('pipeline.granularity.broad') }
					]}
				/>
			</div>

			<div class="control-row">
				<div>
					<label for="pages-input">{t('pipeline.perFamily.label')}</label>
					<small>{t('pipeline.perFamily.hint', { max: config.maxProductsPerPage })}</small>
				</div>
				<input
					id="pages-input"
					type="number"
					min="1"
					max="5"
					bind:value={config.pagesPerFamily}
					style="width:70px;"
				/>
			</div>
		</div>

		<div class="action-row">
			<Button onclick={onValidate} disabled={isBusy}>
				<Icon name="filter" size={14} />
				{t('pipeline.validate')}
			</Button>
			<Button variant="secondary" onclick={onCompare} disabled={isBusy}>
				<Icon name="truck" size={14} />
				{t('pipeline.compare')}
			</Button>
			<Button variant="secondary" onclick={onGenerateRfq} disabled={isBusy}>
				<Icon name="file-spreadsheet" size={14} />
				{t('pipeline.rfq')}
			</Button>
		</div>

		{#if status}
			<Alert tone="warn" icon="sparkles" class="status-alert">
				{t(status.key, status.params)}
			</Alert>
		{/if}
	</Card>

	<Card variant="panel">
		<div class="panel-heading">
			<div>
				<h2>{t('pipeline.filters.title')}</h2>
				<p>{t('pipeline.filters.subtitle')}</p>
			</div>
			<span class="panel-total">{tn('pipeline.filters.disqualified', disqualifiedCount)}</span>
		</div>

		<div class="control-group">
			<div class="control-row">
				<div>
					<label for="ta-filter">{t('pipeline.ta.label')}</label>
					<small>{t('pipeline.ta.hint')}</small>
				</div>
				<input
					id="ta-filter"
					type="checkbox"
					bind:checked={config.filters.requireTradeAssurance}
					onchange={onValidate}
				/>
			</div>

			<div class="control-row">
				<div>
					<label for="moq-filter">{t('pipeline.moq.label')}</label>
					<small>{t('pipeline.moq.hint')}</small>
				</div>
				<input
					id="moq-filter"
					type="checkbox"
					bind:checked={config.filters.strictMoq}
					onchange={onValidate}
				/>
			</div>

			<div class="control-row">
				<div>
					<label for="min-price-filter">{t('pipeline.minPrice.label')}</label>
					<small>{t('pipeline.minPrice.hint')}</small>
				</div>
				<input
					id="min-price-filter"
					type="checkbox"
					bind:checked={config.filters.strictMinPrice}
					onchange={onValidate}
				/>
			</div>

			<div class="control-row">
				<div>
					<label for="years-filter">{t('pipeline.years.label')}</label>
					<small>{t('pipeline.years.hint')}</small>
				</div>
				<input
					id="years-filter"
					type="number"
					min="0"
					max="20"
					bind:value={config.filters.minYears}
					onchange={onValidate}
					style="width:70px;"
				/>
			</div>

			<div class="control-row">
				<div>
					<label for="certs-filter">{t('pipeline.certs.label')}</label>
					<small>{t('pipeline.certs.hint')}</small>
				</div>
				<input
					id="certs-filter"
					type="text"
					placeholder="CE, ISO9001"
					value={certsInput}
					onchange={(e) => {
						handleCertsChange(e.currentTarget.value);
						onValidate();
					}}
					style="width:140px;"
				/>
			</div>
		</div>

		<div class="panel-heading weights-heading">
			<div>
				<h2>{t('pipeline.weights.title')}</h2>
				<p>
					{t('pipeline.weights.subtitle', {
						vendor: config.weights.vendorScore,
						rfq: config.weights.rfqFit
					})}
				</p>
			</div>
		</div>

		<div class="control-group">
			<div class="control-row">
				<label for="w-price">{t('pipeline.weight.price', { value: config.weights.price })}</label>
				<input id="w-price" type="range" min="0" max="60" bind:value={config.weights.price} onchange={onValidate} />
			</div>
			<div class="control-row">
				<label for="w-moq">{t('pipeline.weight.moq', { value: config.weights.moq })}</label>
				<input id="w-moq" type="range" min="0" max="50" bind:value={config.weights.moq} onchange={onValidate} />
			</div>
			<div class="control-row">
				<label for="w-ta">{t('pipeline.weight.ta', { value: config.weights.tradeAssurance })}</label>
				<input id="w-ta" type="range" min="0" max="50" bind:value={config.weights.tradeAssurance} onchange={onValidate} />
			</div>
			<div class="control-row">
				<label for="w-years">{t('pipeline.weight.years', { value: config.weights.years })}</label>
				<input id="w-years" type="range" min="0" max="40" bind:value={config.weights.years} onchange={onValidate} />
			</div>
			<div class="control-row">
				<label for="w-certs">{t('pipeline.weight.certs', { value: config.weights.certs })}</label>
				<input id="w-certs" type="range" min="0" max="40" bind:value={config.weights.certs} onchange={onValidate} />
			</div>
		</div>
	</Card>
</div>
