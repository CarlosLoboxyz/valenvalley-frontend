<script lang="ts">
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import { usePreferences } from '$lib/stores/preferences.svelte';

	interface Props {
		/** `chrome` para fondos navy (topbar); `default` sobre superficies normales. */
		tone?: 'default' | 'chrome';
	}

	let { tone = 'default' }: Props = $props();

	const prefs = usePreferences();
</script>

<IconButton
	icon={prefs.theme === 'dark' ? 'sun' : 'moon'}
	label={prefs.theme === 'dark' ? prefs.t('prefs.theme.toLight') : prefs.t('prefs.theme.toDark')}
	{tone}
	bordered={tone === 'default'}
	onclick={() => prefs.toggleTheme()}
/>
