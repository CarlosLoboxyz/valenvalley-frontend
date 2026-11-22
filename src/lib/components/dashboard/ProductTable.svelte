<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { hasNoSupplier } from '$lib/domain/labels';
	import type { MessageKey } from '$lib/i18n';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import { ALL_FILTER, type RecommendationItem, type ScoreFilter } from '$lib/types/sourcing';
	import { padPosition, scoreTone, tierTone } from '$lib/utils/format';

	interface Props {
		items: RecommendationItem[];
		totalFiltered: number;
		sourceLabel: string;
		query: string;
		scoreFilter: ScoreFilter;
		familyFilter: string;
		supplierFilter: string;
		familyCodes: string[];
		providers: string[];
		currentPage: number;
		pageCount: number;
		pageSize: number;
		expandedRowPos: number | null;
		onQueryChange: (val: string) => void;
		onScoreFilterChange: (val: ScoreFilter) => void;
		onFamilyFilterChange: (val: string) => void;
		onSupplierFilterChange: (val: string) => void;
		onPageChange: (page: number) => void;
		onPageSizeChange: (size: number) => void;
		onToggleExpand: (pos: number) => void;
		onInspectItem: (item: RecommendationItem) => void;
	}

	let {
		items,
		totalFiltered,
		sourceLabel,
		query,
		scoreFilter,
		familyFilter,
		supplierFilter,
		familyCodes,
		providers,
		currentPage,
		pageCount,
		pageSize,
		expandedRowPos,
		onQueryChange,
		onScoreFilterChange,
		onFamilyFilterChange,
		onSupplierFilterChange,
		onPageChange,
		onPageSizeChange,
		onToggleExpand,
		onInspectItem
	}: Props = $props();

	const { t, tn, n, score, qty, budget, moq, price, source, tier, flag } = usePreferences();

	const rangeStart = $derived(totalFiltered === 0 ? 0 : (currentPage - 1) * pageSize + 1);
	const rangeEnd = $derived(Math.min(currentPage * pageSize, totalFiltered));

	const scoreFilters: { value: ScoreFilter; label: MessageKey }[] = [
		{ value: 'all', label: 'filter.score.all' },
		{ value: 'strong', label: 'filter.score.strong' },
		{ value: 'consider', label: 'filter.score.consider' },
		{ value: 'score50', label: 'filter.score.score50' },
		{ value: 'review', label: 'filter.score.review' }
	];

	function supplierName(item: RecommendationItem): string {
		return hasNoSupplier(item.supplier) ? t('common.noQualifyingSupplier') : item.supplier;
	}
</script>

<Card variant="panel" class="products-panel" id="products">
	<div class="panel-heading products-heading">
		<div>
			<h2>
				{t('table.title')} <span class="product-count">{totalFiltered}</span>
			</h2>
			<p>{t('table.subtitle')}</p>
		</div>

		<div class="table-controls">
			<label class="search-box">
				<Icon name="search" size={15} />
				<input
					aria-label={t('table.search.aria')}
					placeholder={t('table.search.placeholder')}
					value={query}
					oninput={(e) => onQueryChange(e.currentTarget.value)}
				/>
			</label>

			<label class="filter-box">
				<Icon name="filter" size={14} />
				<select
					aria-label={t('table.filter.score.aria')}
					value={scoreFilter}
					onchange={(e) => onScoreFilterChange(e.currentTarget.value as ScoreFilter)}
				>
					{#each scoreFilters as option (option.value)}
						<option value={option.value}>{t(option.label)}</option>
					{/each}
				</select>
				<span class="chevron-icon"><Icon name="chevron-down" size={13} /></span>
			</label>

			<label class="filter-box">
				<select
					aria-label={t('table.filter.family.aria')}
					value={familyFilter}
					onchange={(e) => onFamilyFilterChange(e.currentTarget.value)}
				>
					<option value={ALL_FILTER}>{t('filter.family.all')}</option>
					{#each familyCodes as family (family)}
						<option value={family}>{family}</option>
					{/each}
				</select>
				<span class="chevron-icon"><Icon name="chevron-down" size={13} /></span>
			</label>

			<label class="filter-box">
				<select
					aria-label={t('table.filter.supplier.aria')}
					value={supplierFilter}
					onchange={(e) => onSupplierFilterChange(e.currentTarget.value)}
				>
					<option value={ALL_FILTER}>{t('filter.supplier.all')}</option>
					{#each providers as provider (provider)}
						<option value={provider}>{provider}</option>
					{/each}
				</select>
				<span class="chevron-icon"><Icon name="chevron-down" size={13} /></span>
			</label>
		</div>
	</div>

	<div class="table-scroll">
		<table>
			<thead>
				<tr>
					<th>{t('table.col.product')}</th>
					<th>{t('table.col.qtyBudget')}</th>
					<th>{t('table.col.supplier')}</th>
					<th>{t('table.col.price')}</th>
					<th>{t('table.col.score')}</th>
					<th>{t('table.col.status')}</th>
				</tr>
			</thead>
			<tbody>
				{#each items as item (item.pos)}
					<tr>
						<td>
							<button
								type="button"
								class="product-accordion"
								aria-expanded={expandedRowPos === item.pos}
								aria-controls={`product-details-${item.pos}`}
								onclick={() => onToggleExpand(item.pos)}
							>
								<span class="product-name">
									<span class="product-number">{padPosition(item.pos)}</span>
									<span>
										{item.product}
										<small>{item.family} · {item.familyName}</small>
									</span>
								</span>
								<span class="accordion-chevron" class:open={expandedRowPos === item.pos}>
									<Icon name="chevron-down" size={14} />
								</span>
							</button>
						</td>
						<td>
							{qty(item.qtyNumeric, item.unit)}
							<small class="cell-sub">
								{t('table.budget', { value: budget(item.minPrice, item.maxPrice) })}
							</small>
						</td>
						<td>
							<span class="supplier-cell">{supplierName(item)}</span>
							<small class="cell-sub">
								{item.vendors > 1
									? tn('table.alternatives', item.vendors - 1, { listings: item.vendors })
									: t('table.noAdditional')}
							</small>
						</td>
						<td class="price-cell">{price(item.price)}</td>
						<td>
							<Badge tone={scoreTone(item.score)}>{score(item.score)}</Badge>
						</td>
						<td>
							<Badge tone={tierTone(item.tier)} size="sm" dot>{tier(item.tier)}</Badge>
						</td>
					</tr>

					{#if expandedRowPos === item.pos}
						<tr class="expanded-detail-row" id={`product-details-${item.pos}`}>
							<td colspan="6">
								<div class="expanded-details">
									<div>
										<small>{t('table.detail.provider')}</small>
										<b>{supplierName(item)}</b>
									</div>
									<div>
										<small>{t('table.detail.moqTenureTa')}</small>
										<b>
											{moq(item.moqLabel)} ·
											{item.yearsActive !== null
												? tn('common.years', item.yearsActive)
												: t('common.unknown')} ·
											{item.hasTradeAssurance ? t('table.ta.verified') : t('table.ta.none')}
										</b>
									</div>
									<div>
										<small>{t('table.detail.scoreComponents')}</small>
										<b>
											{t('table.detail.scoreValue', {
												vendor: score(item.breakdown.vendorScore),
												rfq: n(item.breakdown.rfqFitScore)
											})}
										</b>
									</div>
									<div>
										<small>{t('table.detail.qtyBudget')}</small>
										<b>{qty(item.qtyNumeric, item.unit)} · {budget(item.minPrice, item.maxPrice)}</b>
									</div>
									<div>
										<small>{t('table.detail.listingPrice')}</small>
										<b>{price(item.price)}</b>
									</div>
									<div>
										<small>{t('table.detail.flags')}</small>
										<b>
											{t('table.detail.flagsValue', {
												flags: item.issues,
												disqualified: item.disqualifiedCount
											})}
										</b>
									</div>
									<div class="expanded-details-footer">
										<p>
											{item.warnings.length > 0
												? item.warnings.map(flag).join(' · ')
												: t('table.detail.noWarnings')}
										</p>
										<Button variant="secondary" onclick={() => onInspectItem(item)}>
											{t('table.detail.fullBreakdown')}
										</Button>
									</div>
								</div>
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>

		{#if items.length === 0}
			<EmptyState icon="search">{t('table.empty')}</EmptyState>
		{/if}
	</div>

	<div class="table-footer">
		<span class="table-range">
			{t('table.range', { from: rangeStart, to: rangeEnd, total: totalFiltered })}
		</span>

		<div class="pagination-controls">
			<label>
				{t('table.rows')}
				<select
					aria-label={t('table.rows.aria')}
					value={pageSize}
					onchange={(e) => onPageSizeChange(Number(e.currentTarget.value))}
				>
					<option value={5}>5</option>
					<option value={10}>10</option>
					<option value={20}>20</option>
				</select>
			</label>
			<button
				type="button"
				aria-label={t('table.prev')}
				disabled={currentPage <= 1}
				onclick={() => onPageChange(Math.max(1, currentPage - 1))}
			>
				<Icon name="chevron-left" size={14} />
			</button>
			<span>{t('table.page', { page: currentPage, pages: pageCount })}</span>
			<button
				type="button"
				aria-label={t('table.next')}
				disabled={currentPage >= pageCount}
				onclick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
			>
				<Icon name="chevron-right" size={14} />
			</button>
		</div>

		<span class="table-source">{t('table.source', { source: source(sourceLabel) })}</span>
	</div>
</Card>
