<script lang="ts">
	import Alert from '$lib/components/ui/Alert.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';
	import type { OnboardingFlow } from '$lib/stores/onboarding.svelte';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import type { Granularity } from '$lib/types/sourcing';

	let {
		flow,
		needsVerification
	}: { flow: OnboardingFlow; needsVerification: boolean } = $props();

	const { t, tn, n } = usePreferences();

	const group = $derived(flow.group);
	const rate = $derived(
		flow.stealth ? flow.limits.creditRates.stealth : flow.limits.creditRates.premium
	);
</script>

{#if group}
	<div class="review-summary">
		<div>
			<span class="review-summary__value">{n(group.total_items)}</span>
			<span class="review-summary__label">{t('onboarding.review.items')}</span>
		</div>
		<div>
			<span class="review-summary__value">{n(group.family_count)}</span>
			<span class="review-summary__label">{t('onboarding.review.families')}</span>
		</div>
		<div>
			<span class="review-summary__value">{n(group.cached_families)}</span>
			<span class="review-summary__label">{t('onboarding.review.cached')}</span>
		</div>
		<div>
			<span class="review-summary__value is-credit">{n(flow.estimatedCredits)}</span>
			<span class="review-summary__label">{t('onboarding.review.credits')}</span>
		</div>
	</div>

	<p class="review-note">{t('onboarding.review.reduction', { pct: n(Math.round(group.api_reduction_pct)) })}</p>

	<div class="review-options">
		<div class="review-option">
			<span class="control-label">{t('pipeline.granularity.label')}</span>
			<SegmentedControl
				size="sm"
				label={t('pipeline.granularity.label')}
				value={flow.granularity}
				onchange={(g: Granularity) => flow.changeOptions({ granularity: g })}
				options={[
					{ value: 'fine', label: t('pipeline.granularity.fine') },
					{ value: 'balanced', label: t('pipeline.granularity.balanced') },
					{ value: 'broad', label: t('pipeline.granularity.broad') }
				]}
			/>
		</div>
		<div class="review-option">
			<label class="control-label" for="onboarding-pages">{t('onboarding.review.pages')}</label>
			<input
				id="onboarding-pages"
				type="number"
				min="1"
				max="5"
				value={flow.pages}
				disabled={flow.busy}
				onchange={(e) => flow.changeOptions({ pages: Number(e.currentTarget.value) })}
				style="width:70px;"
			/>
		</div>
		<div class="review-option">
			<label class="control-label" for="onboarding-stealth">{t('onboarding.review.stealth')}</label>
			<input
				id="onboarding-stealth"
				type="checkbox"
				checked={flow.stealth}
				disabled={flow.busy}
				onchange={(e) => flow.changeOptions({ stealth: e.currentTarget.checked })}
			/>
		</div>
	</div>

	{#if group.warnings.length > 0}
		<Alert tone="info">
			{#each group.warnings as warning (warning)}<div>{warning}</div>{/each}
		</Alert>
	{/if}

	<div class="family-list" role="region" aria-label={t('onboarding.review.familiesAria')}>
		{#each group.families as family (family.family_id)}
			<div class="family-row">
				<div>
					<b>{family.family_name}</b>
					<small>{family.search_query}</small>
				</div>
				<span class="family-row__count">{tn('common.items', family.item_count)}</span>
				<Badge tone={family.is_cached ? 'good' : 'warn'} size="sm">
					{family.is_cached
						? t('onboarding.review.familyCached', { count: family.cached_listing_count })
						: t('onboarding.review.familyNew')}
				</Badge>
			</div>
		{/each}
	</div>

	{#if flow.needsScrape}
		<div class="confirm-box" class:is-blocked={flow.overJobCap}>
			<h3>{t('onboarding.confirm.title')}</h3>
			<p>
				{t('onboarding.confirm.body', {
					families: n(group.uncached_families),
					pages: n(flow.pages),
					rate: n(rate),
					credits: n(flow.estimatedCredits)
				})}
			</p>
			{#if flow.limits.maxCreditsPerJob !== null}
				<p class="confirm-box__cap">
					{t('onboarding.confirm.capJob', { cap: n(flow.limits.maxCreditsPerJob) })}
				</p>
			{/if}
			{#if flow.limits.maxCreditsPerDay !== null}
				<p class="confirm-box__cap">
					{t('onboarding.confirm.capDay', { cap: n(flow.limits.maxCreditsPerDay) })}
				</p>
			{/if}
			{#if flow.overJobCap}
				<Alert tone="error">{t('onboarding.error.creditCap')}</Alert>
			{:else}
				<label class="confirm-box__check">
					<input
						type="checkbox"
						checked={flow.confirmed}
						disabled={flow.busy}
						onchange={(e) => (flow.confirmed = e.currentTarget.checked)}
					/>
					<span>{t('onboarding.confirm.check', { credits: n(flow.estimatedCredits) })}</span>
				</label>
			{/if}
			{#if needsVerification}
				<Alert tone="info">{t('onboarding.confirm.verify')}</Alert>
			{/if}
		</div>
	{:else}
		<Alert tone="info">{t('onboarding.review.allCached')}</Alert>
	{/if}

	<div class="cta-row cta-row--split">
		<Button variant="secondary" size="lg" disabled={flow.busy} onclick={() => flow.restart()}>
			{t('onboarding.back')}
		</Button>
		{#if flow.needsScrape}
			<Button size="lg" disabled={!flow.canStart} onclick={() => flow.startScrape()}>
				{flow.busy
					? t('onboarding.working')
					: t('onboarding.confirm.start', { credits: n(flow.estimatedCredits) })}
			</Button>
			<Button variant="ghost" size="lg" disabled={flow.busy} onclick={() => flow.viewResults()}>
				{t('onboarding.review.skip')}
			</Button>
		{:else}
			<Button size="lg" disabled={flow.busy} onclick={() => flow.viewResults()}>
				{flow.busy ? t('onboarding.working') : t('onboarding.review.viewResults')}
			</Button>
		{/if}
	</div>
{/if}
