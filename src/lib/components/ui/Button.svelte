<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	type Variant = 'primary' | 'secondary' | 'navy' | 'ghost';
	type Size = 'sm' | 'md' | 'lg';

	interface Props extends Omit<HTMLButtonAttributes, 'children'> {
		variant?: Variant;
		size?: Size;
		block?: boolean;
		/** Con `href` se renderiza como enlace con el mismo aspecto. */
		href?: string;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'sm',
		block = false,
		href,
		type = 'button',
		class: className = '',
		children,
		...rest
	}: Props = $props();

	const classes = $derived(
		[
			'btn',
			`btn--${variant}`,
			size !== 'sm' ? `btn--${size}` : '',
			block ? 'btn--block' : '',
			className
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

{#if href}
	<a {href} class={classes} {...rest as HTMLAnchorAttributes}>{@render children()}</a>
{:else}
	<button {type} class={classes} {...rest}>{@render children()}</button>
{/if}
