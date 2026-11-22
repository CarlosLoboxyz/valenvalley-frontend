<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';

	interface Props {
		catalogName: string;
		proxyMode: 'premium' | 'stealth';
		fromCache: boolean;
		cautionCount: number;
		onReviewFlagged: () => void;
	}

	let { catalogName, proxyMode, fromCache, cautionCount, onReviewFlagged }: Props = $props();
</script>

<header class="topbar">
	<div class="crumb">
		Sourcing reports <span>/</span> <b>{catalogName} · Alibaba</b>
	</div>
	<div class="topbar-actions">
		<span class="mode-badge">
			{fromCache ? 'CACHE · 0 CREDITS' : `LIVE · ${proxyMode.toUpperCase()}`}
		</span>
		<button
			type="button"
			class="icon-button"
			aria-label={`${cautionCount} flagged items need review`}
			title={`${cautionCount} items marked Caution — click to review`}
			onclick={onReviewFlagged}
		>
			<Icon name="bell" size={18} />
			{#if cautionCount > 0}
				<i></i>
			{/if}
		</button>
	</div>
</header>
