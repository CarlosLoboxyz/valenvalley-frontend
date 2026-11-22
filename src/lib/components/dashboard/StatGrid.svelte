<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { usePreferences } from '$lib/stores/preferences.svelte';

	interface Props {
		itemCount: number;
		familyCount: number;
		cautionCount: number;
		averageScore: string;
	}

	let { itemCount, familyCount, cautionCount, averageScore }: Props = $props();

	const { t, tn, n, score } = usePreferences();

	const average = $derived(Number(averageScore));
	const readyCount = $derived(Math.max(0, itemCount - cautionCount));
</script>

<div class="stat-grid">
	<Card variant="stat">
		<div class="stat-top">
			{t('stats.materials')}
			<span class="stat-icon"><Icon name="shopping-bag" size={16} /></span>
		</div>
		<div class="stat-value">
			{n(itemCount)} <span class="stat-unit">{tn('common.itemsWord', itemCount)}</span>
		</div>
		<div class="stat-foot">{tn('stats.materials.foot', familyCount)}</div>
	</Card>

	<Card variant="stat">
		<div class="stat-top">
			{t('stats.review')}
			<span class="stat-icon"><Icon name="shield-alert" size={16} /></span>
		</div>
		<div class="stat-value">
			{n(cautionCount)} <span class="stat-unit">{tn('common.itemsWord', cautionCount)}</span>
		</div>
		<div class="stat-foot">
			<Badge tone={cautionCount === 0 ? 'good' : 'warn'}>
				{cautionCount === 0 ? t('stats.review.none') : t('stats.review.some')}
			</Badge>
		</div>
	</Card>

	<Card variant="stat" accent>
		<div class="stat-top">
			{t('stats.ready')}
			<span class="stat-icon stat-icon--accent"><Icon name="sparkles" size={16} /></span>
		</div>
		<div class="stat-value">
			{n(readyCount)} <span class="stat-unit">{tn('common.itemsWord', readyCount)}</span>
		</div>
		<div class="stat-foot">{t('stats.ready.foot')}</div>
	</Card>

	<Card variant="stat">
		<div class="stat-top">
			{t('stats.score')}
			<span class="stat-icon"><Icon name="zap" size={16} /></span>
		</div>
		<div class="stat-value">
			{score(average)}<span class="out-of"> / 100</span>
		</div>
		<div class="stat-foot">
			<Badge tone={average >= 55 ? 'good' : 'warn'}>
				{average >= 75
					? t('stats.score.strong')
					: average >= 55
						? t('stats.score.consider')
						: t('stats.score.review')}
			</Badge>
		</div>
	</Card>
</div>
