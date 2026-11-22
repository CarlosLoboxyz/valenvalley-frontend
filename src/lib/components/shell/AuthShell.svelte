<script lang="ts">
	import type { Snippet } from 'svelte';
	import BrandLogo from '$lib/components/brand/BrandLogo.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import LocaleSwitcher from './LocaleSwitcher.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	interface Props {
		title: string;
		subtitle: string;
		/** Tarjeta más ancha para pantallas con listas y tablas (ingesta). */
		wide?: boolean;
		children: Snippet;
		footer?: Snippet;
	}

	let { title, subtitle, wide = false, children, footer }: Props = $props();
</script>

<div class="auth-page">
	<div class="auth-toolbar">
		<LocaleSwitcher />
		<ThemeToggle />
	</div>

	<Card variant="plain" as="section" class={wide ? 'auth-card auth-card--wide' : 'auth-card'}>
		<div class="auth-brand">
			<BrandLogo size={44} variant="on-light" />
		</div>

		<h1 class="auth-title">{title}</h1>
		<p class="auth-subtitle">{subtitle}</p>

		{@render children()}

		{#if footer}
			<p class="auth-foot">{@render footer()}</p>
		{/if}
	</Card>
</div>
