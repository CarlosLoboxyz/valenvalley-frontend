<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import { usePreferences } from '$lib/stores/preferences.svelte';

	interface Props {
		totalCount: number;
		cautionCount: number;
		onReviewFlagged: () => void;
	}

	let { totalCount, cautionCount, onReviewFlagged }: Props = $props();

	const { t } = usePreferences();
</script>

<div class="insight-banner" id="insights">
	<div class="insight-symbol">
		<Icon name="shield-alert" size={19} />
	</div>
	<div class="insight-copy">
		<b>
			{cautionCount === totalCount
				? t('insight.all')
				: t('insight.some', { count: cautionCount, total: totalCount })}
		</b>
		<p>{t('insight.body', { count: cautionCount })}</p>
	</div>
	<button type="button" onclick={onReviewFlagged}>
		{t('insight.cta')} <Icon name="arrow-down-right" size={15} />
	</button>
</div>
