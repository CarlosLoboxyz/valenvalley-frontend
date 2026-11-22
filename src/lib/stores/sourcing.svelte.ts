import { DEFAULT_PIPELINE_CONFIG } from '$lib/config/pipeline-config';
import { createInitialSourcingReport } from '$lib/data/sample-report';
import { hasFlagCode } from '$lib/domain/flags';
import { MOQ_UNCONFIRMED, SOURCE_LOCAL_VALIDATION, sourceUploaded } from '$lib/domain/labels';
import { normalizeReport } from '$lib/domain/report';
import type { Locale } from '$lib/i18n';
import { calculateCreditEstimate } from '$lib/modules/cost-estimator';
import { exportReportAsExcel, exportReportAsJson } from '$lib/modules/export-report';
import { groupProductsIntoFamilies } from '$lib/modules/family-grouper';
import { buildSourcingReport, parseRfqWorkbook } from '$lib/modules/rfq-processor';
import {
	ALL_FILTER,
	type DashboardTab,
	type Granularity,
	type PipelineConfig,
	type QualitySignal,
	type RecommendationItem,
	type ScoreFilter,
	type SourcingReport,
	type StatusMessage
} from '$lib/types/sourcing';

/** Error cuyo mensaje se traduce en la vista (clave + parámetros), no texto fijo. */
class StatusError extends Error {
	constructor(readonly status: StatusMessage) {
		super(status.key);
	}
}

export class SourcingStore {
	report = $state<SourcingReport>(createInitialSourcingReport());
	config = $state<PipelineConfig>(structuredClone(DEFAULT_PIPELINE_CONFIG));

	// Navigation & Modal state
	activeTab = $state<DashboardTab>('overview');
	selectedItem = $state<RecommendationItem | null>(null);
	statusMessage = $state<StatusMessage | null>(null);
	isBusy = $state<boolean>(false);

	// Table filter & pagination state
	query = $state<string>('');
	scoreFilter = $state<ScoreFilter>('all');
	familyFilter = $state<string>(ALL_FILTER);
	supplierFilter = $state<string>(ALL_FILTER);
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
				this.scoreFilter === 'all' ||
				(this.scoreFilter === 'strong' && x.score >= 75) ||
				(this.scoreFilter === 'consider' && x.score >= 55) ||
				(this.scoreFilter === 'score50' && x.score >= 50) ||
				(this.scoreFilter === 'review' && x.issues >= 4);
			const matchesSupplier =
				this.supplierFilter === ALL_FILTER || x.supplier === this.supplierFilter;
			const matchesFamily =
				this.familyFilter === ALL_FILTER || x.family === this.familyFilter;
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
		const total = this.items.length;
		let moqMissing = 0;
		let brandMismatch = 0;
		let belowTarget = 0;
		let tenureUnknown = 0;

		for (const item of this.items) {
			if (item.moqLabel === MOQ_UNCONFIRMED) moqMissing++;
			if (hasFlagCode(item.warnings, 'W_BRAND_MISMATCH', 'W_STRICT_BRAND_MISSING')) brandMismatch++;
			if (hasFlagCode(item.warnings, 'W_BELOW_TARGET_FLOOR')) belowTarget++;
			if (item.yearsActive === null) tenureUnknown++;
		}

		return [
			{ id: 'moq', severity: moqMissing > 0 ? 'HIGH' : 'CHECK', count: moqMissing, total },
			{ id: 'brand', severity: brandMismatch > 0 ? 'HIGH' : 'CHECK', count: brandMismatch, total },
			{ id: 'price', severity: 'CHECK', count: belowTarget, total },
			{ id: 'tenure', severity: 'CHECK', count: tenureUnknown, total }
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
		this.scoreFilter = 'review';
		this.page = 1;
	}

	resetFilters() {
		this.query = '';
		this.scoreFilter = 'all';
		this.familyFilter = ALL_FILTER;
		this.supplierFilter = ALL_FILTER;
		this.page = 1;
	}

	/**
	 * Valida/recalcula usando el backend FastAPI (0 créditos) vía el proxy de SvelteKit.
	 * Si el backend no está configurado o falla, se informa el error y NO se inventan datos.
	 */
	async validateList() {
		this.isBusy = true;
		this.statusMessage = { key: 'status.fetching' };
		try {
			const response = await fetch('/api/backend/score', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					config: structuredClone(this.config),
					positions: null
				})
			});
			const data = (await response.json()) as {
				report?: SourcingReport;
				error?: { code: string; detail: unknown };
			};
			if (!response.ok || data.error) {
				throw new StatusError({
					key: 'status.rawError',
					params: { message: String(data.error?.detail ?? 'backend') }
				});
			}
			if (!data.report) throw new StatusError({ key: 'error.backendUnavailable' });
			this.report = normalizeReport(data.report);
			this.config = structuredClone(data.report.config);
			this.resetFilters();
			this.statusMessage = {
				key: 'status.validated',
				params: { count: this.report.recommendations.length }
			};
		} catch (err) {
			this.statusMessage =
				err instanceof StatusError ? err.status : { key: 'error.backendUnavailable' };
		} finally {
			this.isBusy = false;
		}
	}

	/**
	 * Re-ejecuta el agrupado dinámico y la re-puntuación offline de la lista
	 * de materiales sin costo de scraping.
	 */
	recalculateOffline(regroup = false) {
		const updated = buildSourcingReport({
			rfqItems: this.report.rfqItems,
			cache: this.report.cache,
			config: structuredClone(this.config),
			catalogName: this.report.catalogName,
			sourceLabel: this.config.fromCache ? SOURCE_LOCAL_VALIDATION : this.report.sourceLabel,
			runDate: this.report.runDate,
			existingFamilies: regroup ? undefined : this.report.families
		});
		this.report = updated;
		this.page = 1;
		this.statusMessage = regroup
			? {
					key: 'status.regrouped',
					params: { products: updated.rfqItems.length, families: updated.families.length }
				}
			: { key: 'status.validated', params: { count: updated.recommendations.length } };
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
		this.statusMessage = null;
		try {
			if (file.name.toLowerCase().endsWith('.json')) {
				const text = await file.text();
				const parsed = JSON.parse(text) as SourcingReport;
				if (!Array.isArray(parsed.recommendations)) {
					throw new StatusError({ key: 'error.import.jsonShape' });
				}
				const report = normalizeReport(parsed);
				this.report = report;
				if (report.config) this.config = structuredClone(report.config);
				this.resetFilters();
				this.statusMessage = {
					key: 'status.loadedReport',
					params: { name: file.name, count: report.recommendations.length }
				};
			} else {
				const buffer = await file.arrayBuffer();
				const rfqItems = parseRfqWorkbook(buffer);
				if (rfqItems.length === 0) {
					throw new StatusError({ key: 'error.import.noRows' });
				}
				const nextReport = buildSourcingReport({
					rfqItems,
					cache: this.report.cache,
					config: structuredClone(this.config),
					catalogName: file.name,
					sourceLabel: sourceUploaded(file.name)
				});
				this.report = nextReport;
				this.resetFilters();
				this.statusMessage = {
					key: 'status.parsedRows',
					params: { rows: rfqItems.length, name: file.name, families: nextReport.families.length }
				};
			}
		} catch (err) {
			this.statusMessage =
				err instanceof StatusError ? err.status : { key: 'error.import.failed' };
		} finally {
			this.isBusy = false;
		}
	}

	async runLiveScrape() {
		this.isBusy = true;
		this.statusMessage = { key: 'status.fetching' };
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
				throw data.error
					? new StatusError({ key: 'status.rawError', params: { message: String(data.error) } })
					: new StatusError({ key: 'error.fetch.http', params: { status: res.status } });
			}
			this.report = normalizeReport(data.report);
			this.statusMessage = {
				key: 'status.fetchDone',
				params: { families: data.familiesScraped }
			};
		} catch (err) {
			this.statusMessage =
				err instanceof StatusError ? err.status : { key: 'error.fetch.failed' };
		} finally {
			this.isBusy = false;
		}
	}

	resetToSample() {
		const initial = createInitialSourcingReport();
		this.report = initial;
		this.config = structuredClone(DEFAULT_PIPELINE_CONFIG);
		this.resetFilters();
		this.statusMessage = { key: 'status.restored' };
	}

	/**
	 * Genera un borrador de RFQ consolidado por proveedor/familia. Solo produce
	 * un resumen listo para revisión humana: sin envío automático (fuera de alcance).
	 */
	generateRfqDraft() {
		const vendorCount = this.report.crossItemVendors.length;
		this.statusMessage =
			vendorCount > 0
				? { key: 'status.rfqReady', params: { count: vendorCount } }
				: { key: 'status.rfqEmpty' };
	}

	exportJson() {
		exportReportAsJson(this.report);
	}

	exportExcel(locale: Locale) {
		exportReportAsExcel(this.report, locale);
	}
}

export const sourcingStore = new SourcingStore();
