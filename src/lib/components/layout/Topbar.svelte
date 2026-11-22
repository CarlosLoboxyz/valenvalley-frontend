<script lang="ts">
	import BrandMark from '$lib/components/brand/BrandMark.svelte';
	import LocaleSwitcher from '$lib/components/shell/LocaleSwitcher.svelte';
	import ThemeToggle from '$lib/components/shell/ThemeToggle.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import { usePreferences } from '$lib/stores/preferences.svelte';

	interface Props {
		catalogName: string;
		itemCount: number;
		cautionCount: number;
		onReviewFlagged: () => void;
	}

	let { catalogName, itemCount, cautionCount, onReviewFlagged }: Props = $props();

	const { t, tn } = usePreferences();
</script>

<header class="topbar">
	<div class="crumb">
		<BrandMark size={22} onDark decorative />
		<span>{t('topbar.materials')}</span>
		<span class="crumb__sep">/</span>
		<b>{catalogName}</b>
	</div>
	<div class="topbar-actions">
		<LocaleSwitcher tone="chrome" />
		<ThemeToggle tone="chrome" />
		<span class="mode-badge">{tn('topbar.summary', itemCount, { review: cautionCount })}</span>
		<IconButton
			icon="bell"
			tone="chrome"
			label={t('topbar.bell', { count: cautionCount })}
			dot={cautionCount > 0}
			onclick={onReviewFlagged}
		/>
		<form method="POST" action="/logout" class="logout-form">
			<IconButton icon="log-out" tone="chrome" type="submit" label={t('auth.logout')} />
		</form>
	</div>
</header>
