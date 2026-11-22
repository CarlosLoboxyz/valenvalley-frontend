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
	import { SourcingStore } from '$lib/stores/sourcing.svelte';
	import UnavailableScreen from '$lib/components/shell/UnavailableScreen.svelte';
	import { untrack } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const prefs = usePreferences();

	// Un store por página (no un singleton de módulo): en SSR se compartiría entre usuarios.
	const store = new SourcingStore(untrack(() => (data.status === 'ready' ? data.initialReport : undefined)));

	function scrollToSection(id: string) {
		requestAnimationFrame(() => {
			document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
		});
	}

	function handleReviewFlagged() {
		store.focusFlaggedItems();
		scrollToSection('products');
	}
</script>

<svelte:head>
	<title>{prefs.t('app.title')}</title>
	<meta name="description" content={prefs.t('app.description')} />
</svelte:head>

{#if data.status === 'ready'}
<main class="app-shell">
	<Sidebar
		activeTab={store.activeTab}
		productCount={store.items.length}
		userEmail={data.user?.email ?? ''}
		onSelectTab={(tab) => store.setTab(tab)}
		onScrollToSection={scrollToSection}
	/>

	<section class="main-area">
		<Topbar
			catalogName={store.report.catalogName}
			itemCount={store.items.length}
			cautionCount={store.cautionCount}
			onReviewFlagged={handleReviewFlagged}
		/>

		<div class="content" id="overview">
			<PageHeader
				activeTab={store.activeTab}
				runDate={store.report.runDate}
				onExportExcel={() => store.exportExcel(prefs.locale)}
				onExportJson={() => store.exportJson()}
				onPrint={() => window.print()}
			/>

			{#if store.noVendorCount > 0}
				<Alert tone="warn" class="source-alert">
					{prefs.t('dashboard.noVendors', { count: store.noVendorCount, total: store.items.length })}
					<a href="/materiales">{prefs.t('dashboard.noVendors.link')}</a>
				</Alert>
			{/if}

			<ViewTabs
				activeTab={store.activeTab}
				onSelectTab={(tab) => store.setTab(tab)}
			/>

			{#if store.activeTab === 'overview'}
				<div
					class="overview-tab-panel"
					id="overview-view"
					role="tabpanel"
					aria-labelledby="overview-tab"
					tabindex="0"
				>
					<StatGrid
						itemCount={store.items.length}
						familyCount={store.report.families.length}
						cautionCount={store.cautionCount}
						averageScore={store.averageScore}
					/>

					<InsightBanner
						totalCount={store.items.length}
						cautionCount={store.cautionCount}
						onReviewFlagged={handleReviewFlagged}
					/>

					<ProductTable
						items={store.paginatedItems}
						totalFiltered={store.filteredItems.length}
						sourceLabel={store.report.sourceLabel}
						query={store.query}
						scoreFilter={store.scoreFilter}
						familyFilter={store.familyFilter}
						supplierFilter={store.supplierFilter}
						familyCodes={store.familyCodes}
						providers={store.providers}
						currentPage={store.currentPage}
						pageCount={store.pageCount}
						pageSize={store.pageSize}
						expandedRowPos={store.expandedRowPos}
						onQueryChange={(val) => {
							store.query = val;
							store.page = 1;
						}}
						onScoreFilterChange={(val) => {
							store.scoreFilter = val;
							store.page = 1;
						}}
						onFamilyFilterChange={(val) => {
							store.familyFilter = val;
							store.page = 1;
						}}
						onSupplierFilterChange={(val) => {
							store.supplierFilter = val;
							store.page = 1;
						}}
						onPageChange={(p) => (store.page = p)}
						onPageSizeChange={(sz) => {
							store.pageSize = sz;
							store.page = 1;
						}}
						onToggleExpand={(pos) => {
							store.expandedRowPos =
								store.expandedRowPos === pos ? null : pos;
						}}
						onInspectItem={(item) => (store.selectedItem = item)}
					/>

					<div class="lower-grid">
						<ConsolidationPanel
							vendors={store.report.crossItemVendors}
							expandedSupplier={store.expandedSupplier}
							onToggleSupplier={(supplier) => {
								store.expandedSupplier =
									store.expandedSupplier === supplier ? null : supplier;
							}}
							onInspectProduct={(item) => (store.selectedItem = item)}
						/>

						<QualitySignalsPanel signals={store.qualitySignals} />
					</div>
				</div>
			{:else if store.activeTab === 'graphs'}
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
						items={store.items}
						families={store.report.families}
						average={store.averageScore}
						onSelect={(item) => (store.selectedItem = item)}
					/>
				</div>
			{:else if store.activeTab === 'pipeline'}
				<div
					class="graphs-view"
					id="pipeline-view"
					role="tabpanel"
					aria-labelledby="pipeline-tab"
					tabindex="0"
				>
					<PipelineControls
						bind:config={store.config}
						disqualifiedCount={store.report.disqualified.length}
						status={store.statusMessage}
						isBusy={store.isBusy}
						onGranularityChange={(g) => store.setGranularity(g)}
						onValidate={() => store.validateList()}
						onCompare={() => {
							store.setTab('overview');
							scrollToSection('suppliers');
						}}
						onGenerateRfq={() => store.generateRfqDraft()}
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
		item={store.selectedItem}
		onClose={() => (store.selectedItem = null)}
	/>
</main>
{:else}
	<UnavailableScreen reason={data.reason} />
{/if}
