import { DEFAULT_PIPELINE_CONFIG } from '$lib/config/pipeline-config';
import { createInitialSourcingReport } from '$lib/data/sample-report';
import { calculateCreditEstimate } from '$lib/modules/cost-estimator';
import { exportReportAsExcel, exportReportAsJson } from '$lib/modules/export-report';
import { groupProductsIntoFamilies } from '$lib/modules/family-grouper';
import { buildSourcingReport, parseRfqWorkbook } from '$lib/modules/rfq-processor';
import type {
	DashboardTab,
	Granularity,
	PipelineConfig,
	QualitySignal,
	RecommendationItem,
	ScoreFilter,
	SourcingReport
} from '$lib/types/sourcing';

export class SourcingStore {
	report = $state<SourcingReport>(createInitialSourcingReport());
	config = $state<PipelineConfig>(structuredClone(DEFAULT_PIPELINE_CONFIG));

	// Navigation & Modal state
	activeTab = $state<DashboardTab>('overview');
	selectedItem = $state<RecommendationItem | null>(null);
	statusMessage = $state<string>('');
	isBusy = $state<boolean>(false);

	// Table filter & pagination state
	query = $state<string>('');
	scoreFilter = $state<ScoreFilter>('All scores');
	familyFilter = $state<string>('All families');
	supplierFilter = $state<string>('All providers');
	page = $state<number>(1);
	pageSize = $state<number>(5);
	expandedRowPos = $state<number | null>(null);
	expandedSupplier = $state<string | null>(null);

	// Derived collections
	items = $derived(this.report.recommendations);

	averageScore = $derived.by(() => {
		if (this.items.length === 0) return '0.0';
		const sum = this.items.reduce((acc, item) => acc + item.score, 0);
		return (sum / this.items.length).toFixed(1);
	});

	providers = $derived(
		Array.from(new Set(this.items.map((x) => x.supplier).filter(Boolean)))
	);

	familyCodes = $derived(
		Array.from(new Set(this.items.map((x) => x.family))).sort()
	);

	filteredItems = $derived.by(() => {
		const q = this.query.trim().toLowerCase();
		return this.items.filter((x) => {
			const matchesQuery =
				!q ||
				`${x.product} ${x.supplier} ${x.family} ${x.familyName}`.toLowerCase().includes(q);
			const matchesScore =
				this.scoreFilter === 'All scores' ||
				(this.scoreFilter === 'Strong Recommend (75+)' && x.score >= 75) ||
				(this.scoreFilter === 'Consider (55+)' && x.score >= 55) ||
				(this.scoreFilter === 'Score 50+' && x.score >= 50) ||
				(this.scoreFilter === 'Needs review' && x.issues >= 4);
			const matchesSupplier =
				this.supplierFilter === 'All providers' || x.supplier === this.supplierFilter;
			const matchesFamily =
				this.familyFilter === 'All families' || x.family === this.familyFilter;
			return matchesQuery && matchesScore && matchesSupplier && matchesFamily;
		});
	});

	pageCount = $derived(Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize)));
	currentPage = $derived(Math.min(this.page, this.pageCount));
	paginatedItems = $derived(
		this.filteredItems.slice(
			(this.currentPage - 1) * this.pageSize,
			this.currentPage * this.pageSize
		)
	);

	cautionCount = $derived(
		this.items.filter((x) => x.tier === 'Caution' || x.tier === 'Disqualified').length
	);

	qualitySignals = $derived.by<QualitySignal[]>(() => {
		let moqMissing = 0;
		let brandMismatch = 0;
		let belowTarget = 0;
		let tenureUnknown = 0;

		for (const item of this.items) {
			if (item.moqLabel === 'Unconfirmed') moqMissing++;
			if (item.warnings.some((w) => w.toLowerCase().includes('brand'))) brandMismatch++;
			if (item.warnings.some((w) => w.toLowerCase().includes('below target'))) belowTarget++;
			if (item.yearsActive === null) tenureUnknown++;
		}

		return [
			{
				id: 'moq',
				title: 'MOQ not confirmed',
				detail:
					moqMissing > 0
						? `Reported missing across ${moqMissing} of ${this.items.length} recommendations`
						: 'All recommendations include confirmed MOQs',
				severity: moqMissing > 0 ? 'HIGH' : 'CHECK',
				count: moqMissing
			},
			{
				id: 'brand',
				title: 'Brand mismatch',
				detail:
					brandMismatch > 0
						? `OEM Generic / target brand not verified in ${brandMismatch} listings`
						: 'Target brand verified across listings',
				severity: brandMismatch > 0 ? 'HIGH' : 'CHECK',
				count: brandMismatch
			},
			{
				id: 'price',
				title: 'Price below target',
				detail:
					belowTarget > 0
						? `${belowTarget} listings below floor — may indicate spec or grade mismatch`
						: 'All listed prices align with target floor',
				severity: 'CHECK',
				count: belowTarget
			},
			{
				id: 'tenure',
				title: 'Supplier tenure unknown',
				detail:
					tenureUnknown > 0
						? `${tenureUnknown} suppliers missing years active — confirm company background`
						: 'Supplier tenure verified for all top recommendations',
				severity: 'CHECK',
				count: tenureUnknown
			}
		];
	});

	liveCreditEstimate = $derived(
		calculateCreditEstimate({
			totalProducts: this.report.rfqItems.length,
			familyCount: this.report.families.length,
			pagesPerFamily: this.config.pagesPerFamily,
			stealthProxy: this.config.stealthProxy
		})
	);

	hydrate(initialReport: SourcingReport) {
		this.report = initialReport;
		this.config = structuredClone(initialReport.config);
	}

	setTab(tab: DashboardTab) {
		this.activeTab = tab;
	}

	focusFlaggedItems() {
		this.activeTab = 'overview';
		this.scoreFilter = 'Needs review';
		this.page = 1;
	}

	resetFilters() {
		this.query = '';
		this.scoreFilter = 'All scores';
		this.familyFilter = 'All families';
		this.supplierFilter = 'All providers';
		this.page = 1;
	}

	/**
	 * Re-runs dynamic family grouping (--dry-run) and offline re-scoring (--from-cache)
	 * at zero ScrapingBee credit cost.
	 */
	recalculateOffline(regroup = false) {
		const updated = buildSourcingReport({
			rfqItems: this.report.rfqItems,
			cache: this.report.cache,
			config: structuredClone(this.config),
			catalogName: this.report.catalogName,
			sourceLabel: this.config.fromCache
				? 'Alibaba · Offline re-score (0 credits · cached)'
				: this.report.sourceLabel,
			runDate: this.report.runDate,
			existingFamilies: regroup ? undefined : this.report.families
		});
		this.report = updated;
		this.page = 1;
		this.statusMessage = regroup
			? `Regrouped ${updated.rfqItems.length} products into ${updated.families.length} families (${this.config.granularity}) and re-scored offline (0 credits).`
			: `Re-scored ${updated.recommendations.length} products offline using cached listings (0 credits).`;
	}

	setGranularity(granularity: Granularity) {
		this.config.granularity = granularity;
		const { families } = groupProductsIntoFamilies(this.report.rfqItems, granularity);
		this.report = {
			...this.report,
			families,
			creditEstimate: calculateCreditEstimate({
				totalProducts: this.report.rfqItems.length,
				familyCount: families.length,
				pagesPerFamily: this.config.pagesPerFamily,
				stealthProxy: this.config.stealthProxy
			})
		};
		this.recalculateOffline(true);
	}

	async importFile(file: File) {
		this.isBusy = true;
		this.statusMessage = '';
		try {
			if (file.name.toLowerCase().endsWith('.json')) {
				const text = await file.text();
				const parsed = JSON.parse(text) as SourcingReport;
				if (!Array.isArray(parsed.recommendations)) {
					throw new Error('JSON file does not match final_recommendations.json structure.');
				}
				this.report = parsed;
				if (parsed.config) this.config = structuredClone(parsed.config);
				this.resetFilters();
				this.statusMessage = `Loaded report "${file.name}" (${parsed.recommendations.length} recommendations).`;
			} else {
				const buffer = await file.arrayBuffer();
				const rfqItems = parseRfqWorkbook(buffer);
				if (rfqItems.length === 0) {
					throw new Error('No valid product rows found in the uploaded RFQ workbook.');
				}
				const nextReport = buildSourcingReport({
					rfqItems,
					cache: this.report.cache,
					config: structuredClone(this.config),
					catalogName: file.name,
					sourceLabel: `Uploaded RFQ (${file.name}) · Dry-run grouping`
				});
				this.report = nextReport;
				this.resetFilters();
				this.statusMessage = `Parsed ${rfqItems.length} RFQ rows from "${file.name}" into ${nextReport.families.length} families.`;
			}
		} catch (err) {
			this.statusMessage = err instanceof Error ? err.message : 'Failed to import file.';
		} finally {
			this.isBusy = false;
		}
	}

	async runLiveScrape() {
		this.isBusy = true;
		this.statusMessage = 'Running ScrapingBee family scrape via server API...';
		try {
			const res = await fetch('/api/pipeline/scrape', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					rfqItems: this.report.rfqItems,
					families: this.report.families,
					config: this.config,
					cache: this.report.cache
				})
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error ?? `Scrape request failed (HTTP ${res.status})`);
			}
			this.report = data.report;
			this.statusMessage = `Scrape complete: ${data.creditsUsed} ScrapingBee credits used across ${data.familiesScraped} families.`;
		} catch (err) {
			this.statusMessage =
				err instanceof Error ? err.message : 'Live scrape failed. Check SCRAPINGBEE_API_KEY in .env.';
		} finally {
			this.isBusy = false;
		}
	}

	resetToSample() {
		const initial = createInitialSourcingReport();
		this.report = initial;
		this.config = structuredClone(DEFAULT_PIPELINE_CONFIG);
		this.resetFilters();
		this.statusMessage = 'Restored default 20-product tooling sourcing report.';
	}

	exportJson() {
		exportReportAsJson(this.report);
	}

	exportExcel() {
		exportReportAsExcel(this.report);
	}
}

export const sourcingStore = new SourcingStore();
