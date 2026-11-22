<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'ghost';
		children: Snippet;
	}

	let {
		variant = 'primary',
		type = 'button',
		class: className = '',
		children,
		...rest
	}: Props = $props();
</script>

<button
	{type}
	class={`export-button ${variant === 'secondary' ? 'secondary' : ''} ${className}`.trim()}
	{...rest}
>
	{@render children()}
</button>
