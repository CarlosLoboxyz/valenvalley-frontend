# Sourcewise — Alibaba B2B Sourcing & Vendor Recommendation Platform (SvelteKit)

A modular **SvelteKit 2 + Svelte 5 + TypeScript** implementation of the **Sourcewise** UI/UX and the **Alibaba B2B Sourcing & Vendor Recommendation Pipeline**.

## Quick Start

```bash
npm install
cp .env.example .env
# Optional: set SCRAPINGBEE_API_KEY in .env for live Alibaba scraping
npm run dev
```

To type-check and build for production:

```bash
npm run check
npm run build
npm run preview
```

## Architecture

### Modular Business Logic (`src/lib/modules/`)
- **`family-grouper.ts`**: Zero-LLM, domain-agnostic 5-view similarity clustering (Terminal Head Noun, Head Bigram, Core Stripped Phrase, JSON Spec-Key Schema, Cleaned Context) with soft log-price damping (`>4.5x`) and two-stage agglomerative clustering (`fine`, `balanced`, `broad`).
- **`vendor-recommender.ts`**: Vendor deduplication/aggregation across listings, mandatory hard filters (`--require-trade-assurance`, `--min-years`, `--max-price`, `--strict-moq`, `--strict-certs`), and 0–100 weighted scoring (Price with `<25%` median bait-price detection, MOQ Fit with `1.5x` negotiable band, Trade Assurance, Years Active, Certifications).
- **`rfq-processor.ts`**: `.xlsx` / `.csv` RFQ workbook parser with header alias normalization, fault-tolerant `technical specs` JSON parsing, flexible vs. strict brand detection, unit normalization, and **75% Vendor Score + 25% RFQ Fit** blended evaluation.
- **`alibaba-scraper.ts`**: Server-side ScrapingBee client (`render_js=true`, `premium_proxy=true` / `stealth_proxy=true`, `ai_extract_rules`, `Authorization: Bearer`), truncation-resilient JSON recovery, tracking URL cleanup, `Spb-cost` credit tracking, and query-keyed caching.
- **`cost-estimator.ts`**: ScrapingBee credit estimator (`30` credits/page premium, `80` credits/page stealth) and 100-item catalog benchmarks.
- **`export-report.ts`**: Generates `final_recommendations.json` and 4-tab `final_recommendations.xlsx` (`Recommendations`, `Family_Search_Plan`, `Cross_Item_Vendors`, `Disqualified`).

### Separate Svelte 5 Components (`src/lib/components/`)
- **`layout/`**: `Sidebar.svelte`, `Topbar.svelte`
- **`dashboard/`**: `PageHeader.svelte`, `ViewTabs.svelte`, `StatGrid.svelte`, `InsightBanner.svelte`, `ProductTable.svelte`, `ConsolidationPanel.svelte`, `QualitySignalsPanel.svelte`, `ProductDetailModal.svelte`
- **`graphs/`**: `DashboardGraphs.svelte`, `FamilyCoverageChart.svelte`, `ScoreDistributionChart.svelte`
- **`pipeline/`**: `PipelineControls.svelte` (RFQ upload, granularity selector, hard filters, weight sliders, 0-credit offline re-scoring, live scrape trigger, CLI command preview)
- **`ui/`**: `Button.svelte`, `Icon.svelte`

### SvelteKit Server API Routes (`src/routes/api/pipeline/`)
- `POST /api/pipeline/group` — Dry-run zero-LLM family clustering and credit estimation
- `POST /api/pipeline/scrape` — Live ScrapingBee family scraping with query-keyed cache
- `POST /api/pipeline/score` — Offline re-scoring (`--from-cache`) with custom filters and weights
- `POST /api/pipeline/export?format=xlsx|json` — Server-generated 4-tab Excel or JSON report download
