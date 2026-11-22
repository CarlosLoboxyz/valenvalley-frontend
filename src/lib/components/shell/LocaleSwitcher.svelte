<script lang="ts">
	import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';
	import type { Locale } from '$lib/i18n';
	import { usePreferences } from '$lib/stores/preferences.svelte';

	interface Props {
		tone?: 'default' | 'chrome';
	}

	let { tone = 'default' }: Props = $props();

	const prefs = usePreferences();

	const options: { value: Locale; label: string }[] = [
		{ value: 'es-VE', label: 'ES' },
		{ value: 'en', label: 'EN' }
	];
</script>

<SegmentedControl
	{options}
	{tone}
	size="sm"
	label={prefs.t('prefs.locale.label')}
	value={prefs.locale}
	onchange={(locale) => prefs.setLocale(locale)}
/>
