<script lang="ts">
	import ConsolidationPanel from '$lib/components/dashboard/ConsolidationPanel.svelte';
	import InsightBanner from '$lib/components/dashboard/InsightBanner.svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import ProductDetailModal from '$lib/components/dashboard/ProductDetailModal.svelte';
	import ProductTable from '$lib/components/dashboard/ProductTable.svelte';
	import QualitySignalsPanel from '$lib/components/dashboard/QualitySignalsPanel.svelte';
	import StatGrid from '$lib/components/dashboard/StatGrid.svelte';
	import ViewTabs from '$lib/components/dashboard/ViewTabs.svelte';
	import DashboardGraphs from '$lib/components/graphs/DashboardGraphs.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import Topbar from '$lib/components/layout/Topbar.svelte';
	import PipelineControls from '$lib/components/pipeline/PipelineControls.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import { sourcingStore } from '$lib/stores/sourcing.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const prefs = usePreferences();

	let hydrated = false;
	$effect(() => {
		if (!hydrated && data.initialReport) {
			sourcingStore.hydrate(data.initialReport);
			hydrated = true;
		}
	});

	function scrollToSection(id: string) {
		requestAnimationFrame(() => {
			document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
		});
	}

	function handleReviewFlagged() {
		sourcingStore.focusFlaggedItems();
		scrollToSection('products');
	}
</script>

<svelte:head>
	<title>{prefs.t('app.title')}</title>
	<meta name="description" content={prefs.t('app.description')} />
</svelte:head>

<main class="app-shell">
	<Sidebar
		activeTab={sourcingStore.activeTab}
		productCount={sourcingStore.items.length}
		onSelectTab={(tab) => sourcingStore.setTab(tab)}
		onScrollToSection={scrollToSection}
	/>

	<section class="main-area">
		<Topbar
			catalogName={sourcingStore.report.catalogName}
			itemCount={sourcingStore.items.length}
			cautionCount={sourcingStore.cautionCount}
			onReviewFlagged={handleReviewFlagged}
		/>

		<div class="content" id="overview">
			<PageHeader
				activeTab={sourcingStore.activeTab}
				runDate={sourcingStore.report.runDate}
				onExportExcel={() => sourcingStore.exportExcel(prefs.locale)}
				onExportJson={() => sourcingStore.exportJson()}
				onPrint={() => window.print()}
			/>

			{#if data.reportSource === 'sample'}
				<Alert tone={data.backendError ? 'error' : 'info'} class="source-alert">
					{prefs.t(data.backendError ? 'error.backendUnavailable' : 'status.usingSample')}
				</Alert>
			{/if}

			<ViewTabs
				activeTab={sourcingStore.activeTab}
				onSelectTab={(tab) => sourcingStore.setTab(tab)}
			/>

			{#if sourcingStore.activeTab === 'overview'}
				<div
					class="overview-tab-panel"
					id="overview-view"
					role="tabpanel"
					aria-labelledby="overview-tab"
					tabindex="0"
				>
					<StatGrid
						itemCount={sourcingStore.items.length}
						familyCount={sourcingStore.report.families.length}
						cautionCount={sourcingStore.cautionCount}
						averageScore={sourcingStore.averageScore}
					/>

					<InsightBanner
						totalCount={sourcingStore.items.length}
						cautionCount={sourcingStore.cautionCount}
						onReviewFlagged={handleReviewFlagged}
					/>

					<ProductTable
						items={sourcingStore.paginatedItems}
						totalFiltered={sourcingStore.filteredItems.length}
						sourceLabel={sourcingStore.report.sourceLabel}
						query={sourcingStore.query}
						scoreFilter={sourcingStore.scoreFilter}
						familyFilter={sourcingStore.familyFilter}
						supplierFilter={sourcingStore.supplierFilter}
						familyCodes={sourcingStore.familyCodes}
						providers={sourcingStore.providers}
						currentPage={sourcingStore.currentPage}
						pageCount={sourcingStore.pageCount}
						pageSize={sourcingStore.pageSize}
						expandedRowPos={sourcingStore.expandedRowPos}
						onQueryChange={(val) => {
							sourcingStore.query = val;
							sourcingStore.page = 1;
						}}
						onScoreFilterChange={(val) => {
							sourcingStore.scoreFilter = val;
							sourcingStore.page = 1;
						}}
						onFamilyFilterChange={(val) => {
							sourcingStore.familyFilter = val;
							sourcingStore.page = 1;
						}}
						onSupplierFilterChange={(val) => {
							sourcingStore.supplierFilter = val;
							sourcingStore.page = 1;
						}}
						onPageChange={(p) => (sourcingStore.page = p)}
						onPageSizeChange={(sz) => {
							sourcingStore.pageSize = sz;
							sourcingStore.page = 1;
						}}
						onToggleExpand={(pos) => {
							sourcingStore.expandedRowPos =
								sourcingStore.expandedRowPos === pos ? null : pos;
						}}
						onInspectItem={(item) => (sourcingStore.selectedItem = item)}
					/>

					<div class="lower-grid">
						<ConsolidationPanel
							vendors={sourcingStore.report.crossItemVendors}
							expandedSupplier={sourcingStore.expandedSupplier}
							onToggleSupplier={(supplier) => {
								sourcingStore.expandedSupplier =
									sourcingStore.expandedSupplier === supplier ? null : supplier;
							}}
							onInspectProduct={(item) => (sourcingStore.selectedItem = item)}
						/>

						<QualitySignalsPanel signals={sourcingStore.qualitySignals} />
					</div>
				</div>
			{:else if sourcingStore.activeTab === 'graphs'}
				<div
					class="graphs-view"
					id="graphs-view"
					role="tabpanel"
					aria-labelledby="graphs-tab"
					tabindex="0"
				>
					<div class="graphs-intro">
						<span class="eyebrow">{prefs.t('graphs.eyebrow')}</span>
						<h2>{prefs.t('graphs.title')}</h2>
						<p>{prefs.t('graphs.body')}</p>
					</div>

					<DashboardGraphs
						items={sourcingStore.items}
						families={sourcingStore.report.families}
						average={sourcingStore.averageScore}
						onSelect={(item) => (sourcingStore.selectedItem = item)}
					/>
				</div>
			{:else if sourcingStore.activeTab === 'pipeline'}
				<div
					class="graphs-view"
					id="pipeline-view"
					role="tabpanel"
					aria-labelledby="pipeline-tab"
					tabindex="0"
				>
					<PipelineControls
						bind:config={sourcingStore.config}
						disqualifiedCount={sourcingStore.report.disqualified.length}
						status={sourcingStore.statusMessage}
						isBusy={sourcingStore.isBusy}
						onGranularityChange={(g) => sourcingStore.setGranularity(g)}
						onValidate={() => sourcingStore.validateList()}
						onCompare={() => {
							sourcingStore.setTab('overview');
							scrollToSection('suppliers');
						}}
						onGenerateRfq={() => sourcingStore.generateRfqDraft()}
						onImportFile={(file) => sourcingStore.importFile(file)}
						onResetSample={() => sourcingStore.resetToSample()}
					/>
				</div>
			{/if}

			<footer class="page-footer">
				CuadraMás <span>·</span>
				{prefs.t('app.footer')}
			</footer>
		</div>
	</section>

	<ProductDetailModal
		item={sourcingStore.selectedItem}
		onClose={() => (sourcingStore.selectedItem = null)}
	/>
</main>
