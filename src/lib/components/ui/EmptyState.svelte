<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon, { type IconName } from './Icon.svelte';

	interface Props {
		icon?: IconName;
		children: Snippet;
	}

	let { icon, children }: Props = $props();
</script>

<div class="empty-state">
	{#if icon}<Icon name={icon} size={20} />{/if}
	<span>{@render children()}</span>
</div>
