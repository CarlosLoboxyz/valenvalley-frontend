<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { RecommendationItem, ScoreFilter } from '$lib/types/sourcing';
	import { formatScore, padPosition, scoreCellClass, tierClass } from '$lib/utils/format';

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

	let rangeStart = $derived(totalFiltered === 0 ? 0 : (currentPage - 1) * pageSize + 1);
	let rangeEnd = $derived(Math.min(currentPage * pageSize, totalFiltered));
</script>

<article class="panel products-panel" id="products">
	<div class="panel-heading products-heading">
		<div>
			<h2>
				Product recommendations <span class="product-count">{totalFiltered}</span>
			</h2>
			<p>Top-ranked listing per requested product · 75% Vendor Score + 25% RFQ Fit</p>
		</div>

		<div class="table-controls">
			<label class="search-box">
				<Icon name="search" size={15} />
				<input
					aria-label="Search products or providers"
					placeholder="Search products..."
					value={query}
					oninput={(e) => onQueryChange(e.currentTarget.value)}
				/>
			</label>

			<label class="filter-box">
				<Icon name="filter" size={14} />
				<select
					aria-label="Filter by score or review status"
					value={scoreFilter}
					onchange={(e) => onScoreFilterChange(e.currentTarget.value as ScoreFilter)}
				>
					<option value="All scores">All scores</option>
					<option value="Strong Recommend (75+)">Strong Recommend (75+)</option>
					<option value="Consider (55+)">Consider (55+)</option>
					<option value="Score 50+">Score 50+</option>
					<option value="Needs review">Needs review</option>
				</select>
				<span class="chevron-icon"><Icon name="chevron-down" size={13} /></span>
			</label>

			<label class="filter-box">
				<select
					aria-label="Filter by product family"
					value={familyFilter}
					onchange={(e) => onFamilyFilterChange(e.currentTarget.value)}
				>
					<option value="All families">All families</option>
					{#each familyCodes as family (family)}
						<option value={family}>{family}</option>
					{/each}
				</select>
				<span class="chevron-icon"><Icon name="chevron-down" size={13} /></span>
			</label>

			<label class="filter-box">
				<select
					aria-label="Filter by provider"
					value={supplierFilter}
					onchange={(e) => onSupplierFilterChange(e.currentTarget.value)}
				>
					<option value="All providers">All providers</option>
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
					<th>PRODUCT</th>
					<th>QTY / BUDGET</th>
					<th>RECOMMENDED SUPPLIER · ALTERNATIVES</th>
					<th>LISTED PRICE</th>
					<th>SCORE</th>
					<th>STATUS</th>
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
								<span
									class="accordion-chevron"
									class:open={expandedRowPos === item.pos}
								>
									<Icon name="chevron-down" size={14} />
								</span>
							</button>
						</td>
						<td>
							{item.qty}
							<small class="cell-sub">Budget {item.budget}</small>
						</td>
						<td>
							<span class="supplier-cell">{item.supplier}</span>
							<small class="cell-sub">
								{item.vendors > 1
									? `${item.vendors - 1} alternatives · ${item.vendors} listings`
									: 'No additional listings'}
							</small>
						</td>
						<td class="price-cell">{item.price}</td>
						<td>
							<span class={`score-cell ${scoreCellClass(item.score)}`}>
								{formatScore(item.score)}
							</span>
						</td>
						<td>
							<span class={`caution-badge ${tierClass(item.tier)}`}>
								<span></span>{item.tier}
							</span>
						</td>
					</tr>

					{#if expandedRowPos === item.pos}
						<tr class="expanded-detail-row" id={`product-details-${item.pos}`}>
							<td colspan="6">
								<div class="expanded-details">
									<div>
										<small>Recommended provider</small>
										<b>{item.supplier}</b>
									</div>
									<div>
										<small>MOQ · Tenure · Trade Assurance</small>
										<b>
											{item.moqLabel} · {item.yearsActive !== null ? `${item.yearsActive} yrs` : 'Unknown'} · {item.hasTradeAssurance ? 'TA Verified' : 'No TA'}
										</b>
									</div>
									<div>
										<small>Score components</small>
										<b>
											Vendor {formatScore(item.breakdown.vendorScore)} (75%) · RFQ Fit {item.breakdown.rfqFitScore} (25%)
										</b>
									</div>
									<div>
										<small>Requested quantity &amp; budget</small>
										<b>{item.qty} · {item.budget}</b>
									</div>
									<div>
										<small>Listing price</small>
										<b>{item.price}</b>
									</div>
									<div>
										<small>Review flags</small>
										<b>{item.issues} flags · {item.disqualifiedCount} disqualified</b>
									</div>
									<div class="expanded-details-footer">
										<p>
											{item.warnings.length > 0
												? item.warnings.join(' · ')
												: 'No warnings flagged for this recommendation.'}
										</p>
										<button
											type="button"
											class="export-button secondary"
											onclick={() => onInspectItem(item)}
										>
											Full score breakdown
										</button>
									</div>
								</div>
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>

		{#if items.length === 0}
			<div class="empty-state">No products match your search or active filters.</div>
		{/if}
	</div>

	<div class="table-footer">
		<span class="table-range">
			Showing <b>{rangeStart}–{rangeEnd}</b> of <b>{totalFiltered}</b> products
		</span>

		<div class="pagination-controls">
			<label>
				Rows
				<select
					aria-label="Products per page"
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
				aria-label="Previous page"
				disabled={currentPage <= 1}
				onclick={() => onPageChange(Math.max(1, currentPage - 1))}
			>
				<Icon name="chevron-left" size={14} />
			</button>
			<span>Page {currentPage} of {pageCount}</span>
			<button
				type="button"
				aria-label="Next page"
				disabled={currentPage >= pageCount}
				onclick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
			>
				<Icon name="chevron-right" size={14} />
			</button>
		</div>

		<span class="table-source">Source: {sourceLabel}</span>
	</div>
</article>
