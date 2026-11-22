<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { DashboardTab } from '$lib/types/sourcing';

	interface Props {
		activeTab: DashboardTab;
		runDate: string;
		onExportExcel: () => void;
		onExportJson: () => void;
		onPrint: () => void;
	}

	let { activeTab, runDate, onExportExcel, onExportJson, onPrint }: Props = $props();

	let headingTitle = $derived(
		activeTab === 'graphs'
			? 'Sourcing graphs'
			: activeTab === 'pipeline'
				? 'Pipeline & scoring'
				: 'Supplier overview'
	);

	let headingSubtitle = $derived(
		activeTab === 'graphs'
			? 'Compare recommendation scores and dynamic product family coverage.'
			: activeTab === 'pipeline'
				? 'Upload an RFQ workbook, adjust zero-LLM clustering granularity, and re-score offline at zero credit cost.'
				: 'Your Alibaba sourcing results, organized into one clear view.'
	);
</script>

<div class="page-heading">
	<div>
		<div class="eyebrow">
			<span class="live-dot"></span> SOURCING RUN · {runDate}
		</div>
		<h1>{headingTitle}</h1>
		<p class="subtitle">{headingSubtitle}</p>
	</div>

	<div class="heading-actions">
		<Button variant="secondary" onclick={onExportJson} title="Download final_recommendations.json">
			<Icon name="download" size={15} />
			JSON
		</Button>
		<Button variant="secondary" onclick={onExportExcel} title="Download 4-tab final_recommendations.xlsx">
			<Icon name="file-spreadsheet" size={15} />
			Excel (.xlsx)
		</Button>
		<Button onclick={onPrint}>
			<Icon name="download" size={15} />
			Export report
		</Button>
	</div>
</div>
