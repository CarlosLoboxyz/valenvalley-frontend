<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { MessageKey } from '$lib/i18n';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import type { DashboardTab } from '$lib/types/sourcing';

	interface Props {
		activeTab: DashboardTab;
		runDate: string;
		onExport: () => void;
	}

	let { activeTab, runDate, onExport }: Props = $props();

	const { t, date } = usePreferences();

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
		<Button onclick={onExport}>
			<Icon name="download" size={15} />
			{t('header.export')}
		</Button>
	</div>
</div>
