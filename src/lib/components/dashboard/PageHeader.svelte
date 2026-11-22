<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { MessageKey } from '$lib/i18n';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import type { DashboardTab } from '$lib/types/sourcing';

	interface Props {
		activeTab: DashboardTab;
		runDate: string;
		onExportExcel: () => void;
		onExportJson: () => void;
		onPrint: () => void;
	}

	let { activeTab, runDate, onExportExcel, onExportJson, onPrint }: Props = $props();

	const { t, locale, date } = usePreferences();

	const titles = {
		overview: 'header.title.overview',
		graphs: 'header.title.graphs',
		pipeline: 'header.title.pipeline'
	} as const satisfies Record<DashboardTab, MessageKey>;

	const subtitles = {
		overview: 'header.subtitle.overview',
		graphs: 'header.subtitle.graphs',
		pipeline: 'header.subtitle.pipeline'
	} as const satisfies Record<DashboardTab, MessageKey>;
</script>

<div class="page-heading">
	<div>
		<div class="eyebrow">
			<span class="live-dot"></span>
			{t('header.eyebrow', { date: date(runDate).toLocaleUpperCase() })}
		</div>
		<h1>{t(titles[activeTab])}</h1>
		<p class="subtitle">{t(subtitles[activeTab])}</p>
	</div>

	<div class="heading-actions">
		<Button variant="secondary" onclick={onExportJson} title={t('header.json.title')}>
			<Icon name="download" size={15} />
			JSON
		</Button>
		<Button variant="secondary" onclick={onExportExcel} title={t('header.excel.title')}>
			<Icon name="file-spreadsheet" size={15} />
			{t('header.excel')}
		</Button>
		<Button onclick={onPrint}>
			<Icon name="download" size={15} />
			{t('header.export')}
		</Button>
	</div>
</div>
