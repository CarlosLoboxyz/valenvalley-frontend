<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { DashboardTab } from '$lib/types/sourcing';

	interface Props {
		activeTab: DashboardTab;
		onSelectTab: (tab: DashboardTab) => void;
	}

	let { activeTab, onSelectTab }: Props = $props();

	const tabs: DashboardTab[] = ['overview', 'graphs', 'pipeline'];

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
		event.preventDefault();
		const currentIdx = tabs.indexOf(activeTab);
		const delta = event.key === 'ArrowRight' ? 1 : -1;
		const nextTab = tabs[(currentIdx + delta + tabs.length) % tabs.length];
		onSelectTab(nextTab);
		document.getElementById(`${nextTab}-tab`)?.focus();
	}
</script>

<div class="view-tabs" role="tablist" aria-label="Dashboard views" onkeydown={handleKeyDown}>
	<button
		type="button"
		role="tab"
		id="overview-tab"
		tabindex={activeTab === 'overview' ? 0 : -1}
		aria-selected={activeTab === 'overview'}
		aria-controls="overview-view"
		class:selected={activeTab === 'overview'}
		onclick={() => onSelectTab('overview')}
	>
		<Icon name="layout-dashboard" size={15} />
		Overview
	</button>

	<button
		type="button"
		role="tab"
		id="graphs-tab"
		tabindex={activeTab === 'graphs' ? 0 : -1}
		aria-selected={activeTab === 'graphs'}
		aria-controls="graphs-view"
		class:selected={activeTab === 'graphs'}
		onclick={() => onSelectTab('graphs')}
	>
		<Icon name="zap" size={15} />
		Graphs <span>2</span>
	</button>

	<button
		type="button"
		role="tab"
		id="pipeline-tab"
		tabindex={activeTab === 'pipeline' ? 0 : -1}
		aria-selected={activeTab === 'pipeline'}
		aria-controls="pipeline-view"
		class:selected={activeTab === 'pipeline'}
		onclick={() => onSelectTab('pipeline')}
	>
		<Icon name="sliders" size={15} />
		Pipeline &amp; Scoring
	</button>
</div>
