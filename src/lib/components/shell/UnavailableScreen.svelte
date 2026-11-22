<script lang="ts">
	import AuthShell from '$lib/components/shell/AuthShell.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { usePreferences } from '$lib/stores/preferences.svelte';

	let { reason }: { reason: 'not_configured' | 'backend_error' } = $props();

	const { t } = usePreferences();
</script>

<AuthShell title={t('unavailable.title')} subtitle={t(reason === 'not_configured' ? 'unavailable.notConfigured' : 'unavailable.backendError')}>
	<div class="auth-form">
		<Button size="lg" block onclick={() => window.location.reload()}>{t('unavailable.retry')}</Button>
		<form method="POST" action="/logout">
			<Button size="lg" block variant="secondary" type="submit">{t('auth.logout')}</Button>
		</form>
	</div>
</AuthShell>
