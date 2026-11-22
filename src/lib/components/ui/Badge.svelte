<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export type BadgeTone = 'warn' | 'good' | 'strong' | 'neutral';

	interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
		tone?: BadgeTone;
		size?: 'sm' | 'md' | 'lg';
		/** Punto indicador a la izquierda. */
		dot?: boolean;
		/** Con `onclick` se renderiza como botón accesible. */
		onclick?: (event: MouseEvent) => void;
		children: Snippet;
	}

	let {
		tone = 'warn',
		size = 'md',
		dot = false,
		onclick,
		class: className = '',
		children,
		...rest
	}: Props = $props();

	const classes = $derived(
		['badge', tone !== 'warn' ? `badge--${tone}` : '', size !== 'md' ? `badge--${size}` : '', className]
			.filter(Boolean)
			.join(' ')
	);
</script>

{#if onclick}
	<button type="button" class={classes} {onclick} {...rest as HTMLAttributes<HTMLButtonElement>}>
		{#if dot}<i class="badge__dot"></i>{/if}
		{@render children()}
	</button>
{:else}
	<span class={classes} {...rest}>
		{#if dot}<i class="badge__dot"></i>{/if}
		{@render children()}
	</span>
{/if}
