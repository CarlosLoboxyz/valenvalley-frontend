<script lang="ts">
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
	import AuthShell from '$lib/components/shell/AuthShell.svelte';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	const { t } = usePreferences();
</script>

<svelte:head>
	<title>{t('auth.meta.title')}</title>
	<meta name="description" content={t('auth.meta.description')} />
</svelte:head>

<AuthShell title={t('auth.title')} subtitle={t('auth.subtitle')}>
	<LoginForm {form} />

	{#snippet footer()}
		{t('auth.firstTime')} <a href="/materiales">{t('auth.firstTime.link')}</a>
	{/snippet}
</AuthShell>
