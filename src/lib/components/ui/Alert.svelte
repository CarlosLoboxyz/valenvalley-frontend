<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon, { type IconName } from './Icon.svelte';

	interface Props {
		tone?: 'warn' | 'error' | 'info';
		icon?: IconName;
		class?: string;
		children: Snippet;
	}

	let { tone = 'warn', icon, class: className = '', children }: Props = $props();
</script>

<div
	class={['alert', `alert--${tone}`, className].filter(Boolean).join(' ')}
	role={tone === 'error' ? 'alert' : 'status'}
>
	{#if icon}
		<Icon name={icon} size={15} class="alert__icon" />
	{/if}
	<div>{@render children()}</div>
</div>
