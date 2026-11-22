<script lang="ts">
	import { BRAND_NAME } from '$lib/brand/mark';
	import BrandMark from './BrandMark.svelte';

	interface Props {
		/** Altura del ícono en px. */
		size?: number;
		/** Muestra u oculta el nombre. */
		showName?: boolean;
		/** Superficie sobre la que se dibuja: define el color del nombre. */
		variant?: 'on-light' | 'on-dark';
	}

	let { size = 32, showName = true, variant = 'on-light' }: Props = $props();
</script>

<span class="brand-logo" class:is-dark={variant === 'on-dark'}>
	<BrandMark {size} onDark={variant === 'on-dark'} decorative={showName} />
	{#if showName}
		<span class="brand-logo__name">{BRAND_NAME}</span>
	{/if}
</span>

<style>
	.brand-logo {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		line-height: 1;
	}
	.brand-logo__name {
		font-family: 'Poppins', sans-serif;
		font-weight: 700;
		font-size: 20px;
		letter-spacing: -0.4px;
		white-space: nowrap;
		color: var(--logo-name);
	}
	.is-dark .brand-logo__name {
		color: var(--gray-light);
	}
</style>
