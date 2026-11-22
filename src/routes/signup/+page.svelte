<script lang="ts">
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
	import AuthShell from '$lib/components/shell/AuthShell.svelte';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	const { t } = usePreferences();
</script>

<svelte:head>
	<title>{t('auth.signup.meta.title')}</title>
	<meta name="description" content={t('auth.signup.meta.description')} />
</svelte:head>

<AuthShell title={t('auth.signup.title')} subtitle={t('auth.signup.subtitle')}>
	<LoginForm mode="signup" {form} />

	{#snippet footer()}
		{t('auth.haveAccount')} <a href="/login">{t('auth.haveAccount.link')}</a>
	{/snippet}
</AuthShell>
