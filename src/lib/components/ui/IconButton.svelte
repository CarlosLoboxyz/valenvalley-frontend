<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Icon, { type IconName } from './Icon.svelte';

	interface Props extends Omit<HTMLButtonAttributes, 'children'> {
		icon: IconName;
		/** Texto accesible obligatorio: el botón no tiene texto visible. */
		label: string;
		tone?: 'default' | 'chrome' | 'sidebar' | 'danger';
		bordered?: boolean;
		small?: boolean;
		/** Punto naranja de notificación. */
		dot?: boolean;
		iconSize?: number;
	}

	let {
		icon,
		label,
		tone = 'default',
		bordered = false,
		small = false,
		dot = false,
		iconSize = 17,
		type = 'button',
		class: className = '',
		...rest
	}: Props = $props();

	const classes = $derived(
		[
			'icon-btn',
			tone !== 'default' ? `icon-btn--${tone}` : '',
			bordered ? 'icon-btn--bordered' : '',
			small ? 'icon-btn--sm' : '',
			className
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

<button {type} class={classes} aria-label={label} title={label} {...rest}>
	<Icon name={icon} size={iconSize} />
	{#if dot}<i class="icon-btn__dot"></i>{/if}
</button>
