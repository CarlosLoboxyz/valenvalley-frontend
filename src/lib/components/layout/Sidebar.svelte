<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { DashboardTab } from '$lib/types/sourcing';

	interface Props {
		activeTab: DashboardTab;
		productCount: number;
		onSelectTab: (tab: DashboardTab) => void;
		onScrollToSection: (id: string) => void;
	}

	let { activeTab, productCount, onSelectTab, onScrollToSection }: Props = $props();
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
		<span class="brand-mark">
			<Icon name="shopping-bag" size={19} />
		</span>
		<span>source<span class="brand-light">wise</span></span>
	</a>

	<div class="workspace-label">WORKSPACE</div>
	<nav class="nav" aria-label="Workspace navigation">
		<button
			type="button"
			class="nav-item"
			class:active={activeTab === 'overview'}
			onclick={() => onSelectTab('overview')}
		>
			<Icon name="layout-dashboard" size={17} />
			Overview
		</button>
		<button
			type="button"
			class="nav-item"
			onclick={() => {
				onSelectTab('overview');
				onScrollToSection('products');
			}}
		>
			<Icon name="shopping-bag" size={17} />
			Product sourcing
			<span class="nav-count">{productCount}</span>
		</button>
		<button
			type="button"
			class="nav-item"
			onclick={() => {
				onSelectTab('overview');
				onScrollToSection('suppliers');
			}}
		>
			<Icon name="truck" size={17} />
			Suppliers
		</button>
		<button
			type="button"
			class="nav-item"
			class:active={activeTab === 'graphs'}
			onclick={() => onSelectTab('graphs')}
		>
			<Icon name="zap" size={17} />
			Sourcing graphs
		</button>
		<button
			type="button"
			class="nav-item"
			class:active={activeTab === 'pipeline'}
			onclick={() => onSelectTab('pipeline')}
		>
			<Icon name="sliders" size={17} />
			Pipeline &amp; scoring
		</button>
	</nav>

	<div class="side-bottom">
		<div class="help-card">
			<div class="help-icon">
				<Icon name="circle-help" size={17} />
			</div>
			<b>Need a hand?</b>
			<p>Learn how to read your sourcing report or tune offline scoring weights.</p>
			<button type="button" onclick={() => onSelectTab('pipeline')}>
				Open scoring controls <Icon name="external-link" size={12} />
			</button>
		</div>
		<div class="profile">
			<div class="avatar">JD</div>
			<div>
				<b>Jordan Davis</b>
				<small>Procurement team</small>
			</div>
			<button
				type="button"
				class="profile-settings"
				aria-label="Pipeline settings"
				onclick={() => onSelectTab('pipeline')}
			>
				<Icon name="settings" size={17} />
			</button>
		</div>
	</div>
</aside>
