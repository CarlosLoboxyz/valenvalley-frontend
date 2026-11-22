<script lang="ts">
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
	import AuthShell from '$lib/components/shell/AuthShell.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import type { PageProps } from './$types';

	let { form, data }: PageProps = $props();

	const { t } = usePreferences();
</script>

<svelte:head>
	<title>{t('auth.meta.title')}</title>
	<meta name="description" content={t('auth.meta.description')} />
</svelte:head>

<AuthShell title={t('auth.title')} subtitle={t('auth.subtitle')}>
	{#if data.registered}
		<Alert tone="info" class="auth-notice">{t('auth.notice.registered')}</Alert>
	{/if}
	<LoginForm mode="login" {form} />

	{#snippet footer()}
		{#if data.signupEnabled}
			{t('auth.firstTime')} <a href="/signup">{t('auth.firstTime.link')}</a>
		{/if}
	{/snippet}
</AuthShell>
