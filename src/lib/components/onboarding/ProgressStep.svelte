<script lang="ts">
	import Alert from '$lib/components/ui/Alert.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { MessageKey } from '$lib/i18n';
	import type { OnboardingFlow } from '$lib/stores/onboarding.svelte';
	import { usePreferences } from '$lib/stores/preferences.svelte';

	let { flow }: { flow: OnboardingFlow } = $props();

	const { t, tn, n } = usePreferences();

	const FAMILY_STATUS_LABELS: Record<string, MessageKey> = {
		cached: 'onboarding.progress.status.cached',
		scraped: 'onboarding.progress.status.scraped',
		missing: 'onboarding.progress.status.missing',
		failed: 'onboarding.progress.status.failed',
		empty: 'onboarding.progress.status.empty',
		cancelled: 'onboarding.progress.status.cancelled'
	};

	function statusLabel(status: string): string {
		const key = FAMILY_STATUS_LABELS[status];
		return key ? t(key) : status;
	}

	const job = $derived(flow.job);
	const finished = $derived(flow.step === 'result');
	const status = $derived(job?.status ?? 'queued');
</script>

<div class="progress-box">
	<div class="progress-box__head">
		<h3>
			{#if !finished}
				<span class="progress-box__title">
					<span class="spinner" aria-hidden="true"></span>
					{t('onboarding.progress.running')}
				</span>
			{:else if status === 'completed'}
				{t('onboarding.result.completed')}
			{:else if status === 'cancelled'}
				{t('onboarding.result.cancelled')}
			{:else}
				{t('onboarding.result.failed')}
			{/if}
		</h3>
		<span class="progress-box__pct">{n(flow.progressPct)}%</span>
	</div>
	<div
		class="progress-bar"
		role="progressbar"
		aria-valuemin="0"
		aria-valuemax="100"
		aria-valuenow={flow.progressPct}
		aria-label={t('onboarding.progress.aria')}
	>
		<div class="progress-bar__fill" style:width="{flow.progressPct}%"></div>
	</div>
	{#if job}
		<p class="review-note">
			{t('onboarding.progress.counts', {
				done: n(job.progress.completed_families),
				total: n(job.progress.total_families),
				cache: n(job.progress.cache_hits),
				live: n(job.progress.live_fetches),
				credits: n(job.credits_spent)
			})}
		</p>
	{:else}
		<p class="review-note">{t('onboarding.progress.starting')}</p>
	{/if}

	{#if job}
		<div class="family-list" role="log" aria-label={t('onboarding.progress.logAria')}>
			{#each job.family_logs as log (log.family_id)}
				<div class="family-row">
					<div>
						<b>{log.search_query}</b>
						{#if log.error}<small>{log.error}</small>{/if}
					</div>
					<span class="family-row__count">{tn('onboarding.progress.listing', log.listing_count)}</span>
					<Badge tone={log.status === 'failed' ? 'warn' : 'good'} size="sm">{statusLabel(log.status)}</Badge>
				</div>
			{/each}
			{#if !finished}
				<div class="family-list__pending" role="status">
					<span class="spinner" aria-hidden="true"></span>
					<span>{t('onboarding.progress.pending')}</span>
				</div>
			{/if}
		</div>
	{/if}

	{#if finished && job?.error}
		<Alert tone="error">{job.error}</Alert>
	{/if}
	{#if finished && status === 'completed' && job && job.progress.live_fetches === 0 && job.credits_spent === 0}
		<Alert tone="info">{t('onboarding.result.nothingFetched')}</Alert>
	{/if}
</div>

<div class="cta-row cta-row--split">
	{#if !finished}
		<Button variant="secondary" size="lg" disabled={flow.busy} onclick={() => flow.cancel()}>
			{t('onboarding.progress.cancel')}
		</Button>
	{:else}
		<Button variant="secondary" size="lg" disabled={flow.busy} onclick={() => flow.restart()}>
			{t('onboarding.result.newList')}
		</Button>
		<Button size="lg" disabled={flow.busy} onclick={() => flow.viewResults()}>
			{flow.busy ? t('onboarding.working') : t('onboarding.review.viewResults')}
		</Button>
	{/if}
</div>

<style>
	.progress-box__title {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}

	.spinner {
		display: inline-block;
		flex: none;
		width: 18px;
		height: 18px;
		border: 2.5px solid var(--border);
		border-top-color: var(--orange);
		border-radius: 50%;
		animation: progress-spin 0.8s linear infinite;
	}

	@keyframes progress-spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation-duration: 2s;
		}
	}
</style>
