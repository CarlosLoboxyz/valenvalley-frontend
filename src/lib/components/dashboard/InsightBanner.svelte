<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';

	interface Props {
		totalCount: number;
		cautionCount: number;
		onReviewFlagged: () => void;
	}

	let { totalCount, cautionCount, onReviewFlagged }: Props = $props();
</script>

<div class="insight-banner" id="insights">
	<div class="insight-symbol">
		<Icon name="shield-alert" size={19} />
	</div>
	<div class="insight-copy">
		<b>
			{cautionCount === totalCount
				? 'Every recommendation needs a closer look'
				: `${cautionCount} of ${totalCount} recommendations need a closer look`}
		</b>
		<p>
			{cautionCount} top-ranked listings are marked “Caution” or “Disqualified.” Confirm MOQ,
			supplier tenure, brand, and product specifications before placing orders.
		</p>
	</div>
	<button type="button" onclick={onReviewFlagged}>
		Review flagged items <Icon name="arrow-down-right" size={15} />
	</button>
</div>
