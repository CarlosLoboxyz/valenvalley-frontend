<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { Preferences, setPreferences } from '$lib/stores/preferences.svelte';
	import type { LayoutData } from './$types';

	interface Props {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: Props = $props();

	// Una instancia por solicitud; los cambios del usuario viven en ella y en las cookies.
	// svelte-ignore state_referenced_locally
	setPreferences(new Preferences(data.theme, data.locale));
</script>

{@render children()}
