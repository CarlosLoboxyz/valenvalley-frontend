<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { RecommendationItem } from '$lib/types/sourcing';
	import { formatScore, padPosition } from '$lib/utils/format';

	interface Props {
		item: RecommendationItem | null;
		onClose: () => void;
	}

	let { item, onClose }: Props = $props();

	function handleWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && item) onClose();
	}
</script>

<svelte:window onkeydown={handleWindowKeydown} />

{#if item}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={onClose}>
		<section
			class="detail-modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="detail-title"
			onclick={(e) => e.stopPropagation()}
		>
			<button type="button" class="modal-close" onclick={onClose} aria-label="Close details">
				×
			</button>

			<div class="eyebrow">
				PRODUCT #{padPosition(item.pos)} · {item.family} ({item.familyName})
			</div>
			<h2 id="detail-title">{item.product}</h2>
			<p class="subtitle">Blended Vendor Score (75%) + RFQ Fit (25%) detail</p>

			<div class="detail-score">
				<span>Match score</span>
				<b>{formatScore(item.score)}<small>/100</small></b>
				<em>{item.tier}</em>
			</div>

			<div class="score-breakdown">
				<div class="breakdown-cell">
					<small>Price</small>
					<b>{item.breakdown.price}</b>
				</div>
				<div class="breakdown-cell">
					<small>MOQ Fit</small>
					<b>{item.breakdown.moqFit}</b>
				</div>
				<div class="breakdown-cell">
					<small>Trade Assur.</small>
					<b>{item.breakdown.tradeAssurance}</b>
				</div>
				<div class="breakdown-cell">
					<small>Years</small>
					<b>{item.breakdown.yearsActive}</b>
				</div>
				<div class="breakdown-cell">
					<small>RFQ Fit</small>
					<b>{item.breakdown.rfqFitScore}</b>
				</div>
			</div>

			<div class="detail-line">
				<span>Recommended supplier</span>
				<b>{item.supplier}</b>
			</div>
			<div class="detail-line">
				<span>Other qualified listings</span>
				<b>{item.vendors > 1 ? `${item.vendors - 1} alternatives` : 'None listed'}</b>
			</div>
			<div class="detail-line">
				<span>Listing price</span>
				<b>{item.price}</b>
			</div>
			<div class="detail-line">
				<span>Target budget</span>
				<b>{item.budget}</b>
			</div>
			<div class="detail-line">
				<span>Quantity requested · MOQ</span>
				<b>{item.qty} · MOQ {item.moqLabel}</b>
			</div>
			<div class="detail-line">
				<span>Tenure · Certifications</span>
				<b>
					{item.yearsActive !== null ? `${item.yearsActive} yrs` : 'Unknown'} · {item.certifications.length > 0 ? item.certifications.join(', ') : 'None listed'}
				</b>
			</div>

			{#if item.warnings.length > 0}
				<div class="detail-alert">
					<Icon name="shield-alert" size={17} />
					<span>{item.warnings.join(' · ')}</span>
				</div>
			{/if}

			<Button class="modal-action" onclick={onClose}>Done</Button>
		</section>
	</div>
{/if}
