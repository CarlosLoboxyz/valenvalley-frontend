<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
		/** Elemento HTML semántico a renderizar. */
		as?: 'article' | 'section' | 'div' | 'aside';
		/** `panel` y `stat` conservan el espaciado del dashboard; `plain` no añade padding. */
		variant?: 'panel' | 'stat' | 'plain';
		/** Borde superior naranja para destacar una tarjeta. */
		accent?: boolean;
		/** Elevación y borde naranja al pasar el cursor. Por defecto solo en `panel` y `stat`. */
		hover?: boolean;
		/** Sin sombra dura. */
		flat?: boolean;
		children: Snippet;
	}

	let {
		as = 'article',
		variant = 'plain',
		accent = false,
		hover,
		flat = false,
		class: className = '',
		children,
		...rest
	}: Props = $props();

	const variantClass = $derived(
		variant === 'panel' ? 'panel' : variant === 'stat' ? 'stat-card' : ''
	);
	const hovers = $derived(hover ?? variant !== 'plain');
	const classes = $derived(
		[
			'card',
			variantClass,
			hovers ? 'card--hover' : '',
			accent ? 'card--accent' : '',
			flat ? 'card--flat' : '',
			className
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

<svelte:element this={as} class={classes} {...rest}>
	{@render children()}
</svelte:element>
