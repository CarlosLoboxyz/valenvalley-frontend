<script lang="ts">
	import BrandLogo from '$lib/components/brand/BrandLogo.svelte';
	import Icon, { type IconName } from '$lib/components/ui/Icon.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import type { MessageKey } from '$lib/i18n';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import type { DashboardTab } from '$lib/types/sourcing';

	interface Props {
		activeTab: DashboardTab;
		productCount: number;
		/** Correo del usuario en sesión (perfil). */
		userEmail: string;
		onSelectTab: (tab: DashboardTab) => void;
		onScrollToSection: (id: string) => void;
	}

	let { activeTab, productCount, userEmail, onSelectTab, onScrollToSection }: Props = $props();

	const initials = $derived(
		(userEmail.split('@')[0] ?? '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '?'
	);

	const { t } = usePreferences();

	interface NavItem {
		label: MessageKey;
		icon: IconName;
		tab: DashboardTab;
		/** Sección a la que se desplaza tras abrir la pestaña (no marca la pestaña como activa). */
		scrollTo?: string;
		count?: boolean;
	}

	const items: NavItem[] = [
		{ label: 'nav.overview', icon: 'layout-dashboard', tab: 'overview' },
		{ label: 'nav.products', icon: 'shopping-bag', tab: 'overview', scrollTo: 'products', count: true },
		{ label: 'nav.suppliers', icon: 'truck', tab: 'overview', scrollTo: 'suppliers' },
		{ label: 'nav.graphs', icon: 'zap', tab: 'graphs' },
		{ label: 'nav.pipeline', icon: 'sliders', tab: 'pipeline' }
	];

	function select(item: NavItem) {
		onSelectTab(item.tab);
		if (item.scrollTo) onScrollToSection(item.scrollTo);
	}
</script>

<aside class="sidebar">
	<a
		class="brand"
		href="#overview"
		onclick={(e) => {
			e.preventDefault();
			onSelectTab('overview');
		}}
	>
		<BrandLogo size={30} variant="on-dark" />
	</a>

	<div class="workspace-label">{t('nav.workspace')}</div>
	<nav class="nav" aria-label={t('nav.aria')}>
		<a class="nav-item nav-item--primary" href="/materiales">
			<Icon name="upload" size={17} />
			{t('nav.newList')}
		</a>
		{#each items as item (item.label)}
			<button
				type="button"
				class="nav-item"
				class:active={!item.scrollTo && activeTab === item.tab}
				onclick={() => select(item)}
			>
				<Icon name={item.icon} size={17} />
				{t(item.label)}
				{#if item.count}<span class="nav-count">{productCount}</span>{/if}
			</button>
		{/each}
	</nav>

	<div class="side-bottom">
		<div class="help-card">
			<div class="help-icon">
				<Icon name="circle-help" size={17} />
			</div>
			<b>{t('help.title')}</b>
			<p>{t('help.body')}</p>
			<button type="button" onclick={() => onSelectTab('pipeline')}>
				{t('help.cta')} <Icon name="external-link" size={12} />
			</button>
		</div>
		<div class="profile">
			<div class="avatar">{initials}</div>
			<div>
				<b title={userEmail}>{userEmail}</b>
				<small>{t('profile.role')}</small>
			</div>
			<IconButton
				icon="settings"
				tone="sidebar"
				label={t('profile.settings')}
				onclick={() => onSelectTab('pipeline')}
			/>
		</div>
	</div>
</aside>
