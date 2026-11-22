<script lang="ts">
	import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import type { DashboardTab } from '$lib/types/sourcing';

	interface Props {
		activeTab: DashboardTab;
		onSelectTab: (tab: DashboardTab) => void;
	}

	let { activeTab, onSelectTab }: Props = $props();

	const { t } = usePreferences();
</script>

<SegmentedControl
	variant="tabs"
	class="segmented--tabs"
	label={t('tabs.aria')}
	value={activeTab}
	onchange={onSelectTab}
	options={[
		{
			value: 'overview',
			label: t('tabs.overview'),
			icon: 'layout-dashboard',
			id: 'overview-tab',
			controls: 'overview-view'
		},
		{
			value: 'graphs',
			label: t('tabs.graphs'),
			icon: 'zap',
			badge: 2,
			id: 'graphs-tab',
			controls: 'graphs-view'
		},
		{
			value: 'pipeline',
			label: t('tabs.pipeline'),
			icon: 'sliders',
			id: 'pipeline-tab',
			controls: 'pipeline-view'
		}
	]}
/>
