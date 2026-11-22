<script lang="ts">
	import Alert from '$lib/components/ui/Alert.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import { hasNoSupplier } from '$lib/domain/labels';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import type { RecommendationItem } from '$lib/types/sourcing';
	import { padPosition, tierTone } from '$lib/utils/format';

	interface Props {
		item: RecommendationItem | null;
		onClose: () => void;
	}

	let { item, onClose }: Props = $props();

	const { t, tn, n, score, qty, budget, moq, price, tier, flag } = usePreferences();

	function handleWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && item) onClose();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}
</script>

<svelte:window onkeydown={handleWindowKeydown} />

{#if item}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={handleBackdropClick}>
		<div class="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
			<IconButton
				icon="x"
				label={t('modal.close')}
				class="modal-close"
				onclick={onClose}
			/>

			<div class="eyebrow">
				{t('modal.eyebrow', {
					pos: padPosition(item.pos),
					family: item.family,
					familyName: item.familyName
				})}
			</div>
			<h2 id="detail-title">{item.product}</h2>
			<p class="subtitle">{t('modal.subtitle')}</p>

			<div class="detail-score">
				<span>{t('modal.matchScore')}</span>
				<b>{score(item.score)}<small>/100</small></b>
				<Badge tone={tierTone(item.tier)} size="lg">{tier(item.tier)}</Badge>
			</div>

			<div class="score-breakdown">
				<div class="breakdown-cell">
					<small>{t('modal.breakdown.price')}</small>
					<b>{n(item.breakdown.price)}</b>
				</div>
				<div class="breakdown-cell">
					<small>{t('modal.breakdown.moq')}</small>
					<b>{n(item.breakdown.moqFit)}</b>
				</div>
				<div class="breakdown-cell">
					<small>{t('modal.breakdown.ta')}</small>
					<b>{n(item.breakdown.tradeAssurance)}</b>
				</div>
				<div class="breakdown-cell">
					<small>{t('modal.breakdown.years')}</small>
					<b>{n(item.breakdown.yearsActive)}</b>
				</div>
				<div class="breakdown-cell">
					<small>{t('modal.breakdown.rfq')}</small>
					<b>{n(item.breakdown.rfqFitScore)}</b>
				</div>
			</div>

			<div class="detail-line">
				<span>{t('modal.line.supplier')}</span>
				<b>{hasNoSupplier(item.supplier) ? t('common.noQualifyingSupplier') : item.supplier}</b>
			</div>
			<div class="detail-line">
				<span>{t('modal.line.others')}</span>
				<b>
					{item.vendors > 1 ? tn('modal.line.others', item.vendors - 1) : t('modal.line.none')}
				</b>
			</div>
			<div class="detail-line">
				<span>{t('modal.line.price')}</span>
				<b>{price(item.price)}</b>
			</div>
			<div class="detail-line">
				<span>{t('modal.line.budget')}</span>
				<b>{budget(item.minPrice, item.maxPrice)}</b>
			</div>
			<div class="detail-line">
				<span>{t('modal.line.qtyMoq')}</span>
				<b>
					{t('modal.line.qtyMoqValue', {
						qty: qty(item.qtyNumeric, item.unit),
						moq: moq(item.moqLabel)
					})}
				</b>
			</div>
			<div class="detail-line">
				<span>{t('modal.line.tenureCerts')}</span>
				<b>
					{item.yearsActive !== null ? tn('common.years', item.yearsActive) : t('common.unknown')} ·
					{item.certifications.length > 0
						? item.certifications.join(', ')
						: t('common.noneListed')}
				</b>
			</div>

			{#if item.warnings.length > 0}
				<Alert tone="warn" icon="shield-alert" class="detail-alert">
					{item.warnings.map(flag).join(' · ')}
				</Alert>
			{/if}

			<Button class="modal-action" block onclick={onClose}>{t('common.done')}</Button>
		</div>
	</div>
{/if}
