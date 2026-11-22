<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { CATALOG_100_BENCHMARKS } from '$lib/modules/cost-estimator';
	import type { CreditEstimate, Granularity, PipelineConfig } from '$lib/types/sourcing';
	import { buildCliCommandPreview } from '$lib/utils/format';

	interface Props {
		config: PipelineConfig;
		catalogName: string;
		creditEstimate: CreditEstimate;
		disqualifiedCount: number;
		statusMessage: string;
		isBusy: boolean;
		onGranularityChange: (g: Granularity) => void;
		onRecalculate: () => void;
		onRunLiveScrape: () => void;
		onImportFile: (file: File) => void;
		onResetSample: () => void;
	}

	let {
		config = $bindable(),
		catalogName,
		creditEstimate,
		disqualifiedCount,
		statusMessage,
		isBusy,
		onGranularityChange,
		onRecalculate,
		onRunLiveScrape,
		onImportFile,
		onResetSample
	}: Props = $props();

	let certsInput = $derived(config.filters.requiredCerts.join(', '));

	let cliCommand = $derived(
		buildCliCommandPreview({
			catalogName,
			pages: config.pagesPerFamily,
			stealth: config.stealthProxy,
			fromCache: config.fromCache,
			dryRun: config.dryRun,
			granularity: config.granularity,
			topN: config.topN,
			requireTradeAssurance: config.filters.requireTradeAssurance,
			minYears: config.filters.minYears,
			strictMoq: config.filters.strictMoq,
			strictCerts: config.filters.strictCerts
		})
	);

	function handleFileInput(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			onImportFile(file);
			input.value = '';
		}
	}

	function handleCertsChange(raw: string) {
		config.filters.requiredCerts = raw
			.split(',')
			.map((s) => s.trim().toUpperCase())
			.filter(Boolean);
	}
</script>

<div class="pipeline-grid">
	<article class="panel">
		<div class="panel-heading">
			<div>
				<h2>RFQ ingestion &amp; dynamic clustering</h2>
				<p>Zero-LLM 5-view grouping with log-price damping · ScrapingBee credit estimator</p>
			</div>
			<span class="panel-total">{creditEstimate.familyCount} families</span>
		</div>

		<div class="control-group">
			<div class="control-row">
				<div>
					<label for="rfq-upload">Import RFQ workbook or report JSON</label>
					<small>Supports .xlsx, .csv (products sheet) or final_recommendations.json</small>
				</div>
				<label class="export-button secondary" style="cursor:pointer;">
					<Icon name="upload" size={14} />
					Choose file
					<input
						id="rfq-upload"
						type="file"
						accept=".xlsx,.xls,.csv,.json"
						style="display:none;"
						onchange={handleFileInput}
					/>
				</label>
			</div>

			<div class="control-row">
				<div>
					<label for="granularity-group">Clustering granularity</label>
					<small>Controls two-stage agglomerative threshold (fine / balanced / broad)</small>
				</div>
				<div class="granularity-pills" id="granularity-group">
					{#each ['fine', 'balanced', 'broad'] as mode (mode)}
						<button
							type="button"
							class:active={config.granularity === mode}
							onclick={() => onGranularityChange(mode as Granularity)}
						>
							{mode}
						</button>
					{/each}
				</div>
			</div>

			<div class="control-row">
				<div>
					<label for="stealth-toggle">ScrapingBee Stealth Proxy (--stealth)</label>
					<small>Premium: 30 credits/page · Stealth: 80 credits/page</small>
				</div>
				<input
					id="stealth-toggle"
					type="checkbox"
					bind:checked={config.stealthProxy}
				/>
			</div>

			<div class="control-row">
				<div>
					<label for="pages-input">Pages per family (-p)</label>
					<small>Organic listings extracted per page: max {config.maxProductsPerPage}</small>
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

			<div class="control-row">
				<div>
					<label for="cache-toggle">Offline cache mode (--from-cache)</label>
					<small>Re-score indefinitely at 0 credits using family_scrape_cache.json</small>
				</div>
				<input
					id="cache-toggle"
					type="checkbox"
					bind:checked={config.fromCache}
				/>
			</div>
		</div>

		<div class="panel-heading" style="margin-top:16px;margin-bottom:8px;">
			<div>
				<h2>Equivalent CLI command</h2>
				<p>Mirrors main.py flags for reproducible terminal runs</p>
			</div>
		</div>
		<pre class="cli-preview">{cliCommand}</pre>

		<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">
			<Button onclick={onRecalculate} disabled={isBusy}>
				<Icon name="play" size={14} />
				Re-score offline (0 credits)
			</Button>
			<Button variant="secondary" onclick={onRunLiveScrape} disabled={isBusy || config.fromCache}>
				<Icon name="zap" size={14} />
				Run live ScrapingBee scrape ({creditEstimate.estimatedCredits} cr)
			</Button>
			<Button variant="secondary" onclick={onResetSample} disabled={isBusy}>
				<Icon name="rotate-ccw" size={14} />
				Reset sample
			</Button>
		</div>

		{#if statusMessage}
			<div class="detail-alert" style="margin-top:12px;">
				<Icon name="sparkles" size={15} />
				<span>{statusMessage}</span>
			</div>
		{/if}
	</article>

	<article class="panel">
		<div class="panel-heading">
			<div>
				<h2>Hard filters &amp; weighted scoring</h2>
				<p>Separate mandatory disqualifiers from 0–100 weighted ranking</p>
			</div>
			<span class="panel-total">{disqualifiedCount} disqualified</span>
		</div>

		<div class="control-group">
			<div class="control-row">
				<div>
					<label for="ta-filter">Require Trade Assurance</label>
					<small>Disqualify suppliers without Alibaba Trade Assurance</small>
				</div>
				<input
					id="ta-filter"
					type="checkbox"
					bind:checked={config.filters.requireTradeAssurance}
					onchange={onRecalculate}
				/>
			</div>

			<div class="control-row">
				<div>
					<label for="moq-filter">Strict MOQ (--strict-moq)</label>
					<small>Disqualify listings with unconfirmed MOQ or MOQ &gt; target qty</small>
				</div>
				<input
					id="moq-filter"
					type="checkbox"
					bind:checked={config.filters.strictMoq}
					onchange={onRecalculate}
				/>
			</div>

			<div class="control-row">
				<div>
					<label for="min-price-filter">Strict Min Price Floor</label>
					<small>Disqualify listings priced below client min price instead of soft penalty</small>
				</div>
				<input
					id="min-price-filter"
					type="checkbox"
					bind:checked={config.filters.strictMinPrice}
					onchange={onRecalculate}
				/>
			</div>

			<div class="control-row">
				<div>
					<label for="years-filter">Minimum years active</label>
					<small>--min-years threshold (0 = no filter)</small>
				</div>
				<input
					id="years-filter"
					type="number"
					min="0"
					max="20"
					bind:value={config.filters.minYears}
					onchange={onRecalculate}
					style="width:70px;"
				/>
			</div>

			<div class="control-row">
				<div>
					<label for="certs-filter">Required certifications</label>
					<small>Comma-separated (e.g. CE, ISO9001, RoHS)</small>
				</div>
				<input
					id="certs-filter"
					type="text"
					placeholder="CE, ISO9001"
					value={certsInput}
					onchange={(e) => {
						handleCertsChange(e.currentTarget.value);
						onRecalculate();
					}}
					style="width:140px;"
				/>
			</div>
		</div>

		<div class="panel-heading" style="margin-top:14px;margin-bottom:8px;">
			<div>
				<h2>Scoring weights (0–100)</h2>
				<p>Vendor Score ({config.weights.vendorScore}%) + RFQ Fit ({config.weights.rfqFit}%)</p>
			</div>
		</div>

		<div class="control-group">
			<div class="control-row">
				<label for="w-price">Price competitiveness ({config.weights.price}%)</label>
				<input id="w-price" type="range" min="0" max="60" bind:value={config.weights.price} onchange={onRecalculate} />
			</div>
			<div class="control-row">
				<label for="w-moq">MOQ fit ({config.weights.moq}%)</label>
				<input id="w-moq" type="range" min="0" max="50" bind:value={config.weights.moq} onchange={onRecalculate} />
			</div>
			<div class="control-row">
				<label for="w-ta">Trade Assurance ({config.weights.tradeAssurance}%)</label>
				<input id="w-ta" type="range" min="0" max="50" bind:value={config.weights.tradeAssurance} onchange={onRecalculate} />
			</div>
			<div class="control-row">
				<label for="w-years">Years active ({config.weights.years}%)</label>
				<input id="w-years" type="range" min="0" max="40" bind:value={config.weights.years} onchange={onRecalculate} />
			</div>
			<div class="control-row">
				<label for="w-certs">Certifications ({config.weights.certs}%)</label>
				<input id="w-certs" type="range" min="0" max="40" bind:value={config.weights.certs} onchange={onRecalculate} />
			</div>
		</div>
	</article>
</div>

<article class="panel" style="margin-top:14px;">
	<div class="panel-heading">
		<div>
			<h2>Verified 100-item catalog benchmarks</h2>
			<p>Zero hardcoded category rules · zero LLM tokens · 1 page per family</p>
		</div>
		<span class="panel-total">Reference table</span>
	</div>
	<div class="table-scroll">
		<table>
			<thead>
				<tr>
					<th>GRANULARITY</th>
					<th>FAMILIES GENERATED</th>
					<th>API CALL REDUCTION</th>
					<th>EST. CREDITS (PREMIUM)</th>
					<th>EST. CREDITS (STEALTH)</th>
				</tr>
			</thead>
			<tbody>
				{#each CATALOG_100_BENCHMARKS as row (row.label)}
					<tr>
						<td style="color:var(--card-foreground);font-weight:600;">{row.label}</td>
						<td>{row.families}</td>
						<td>{row.reductionPct > 0 ? `-${row.reductionPct}%` : '0%'}</td>
						<td class="price-cell">{row.premiumCredits.toLocaleString()}</td>
						<td class="price-cell">{row.stealthCredits.toLocaleString()}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</article>
