<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { loginSchema, type LoginFieldErrors } from '$lib/schemas/auth';
	import { usePreferences } from '$lib/stores/preferences.svelte';

	let { form }: { form?: LoginFieldErrors | null } = $props();

	const { t, msg } = usePreferences();

	let email = $state('');
	let password = $state('');
	let clientErrors = $state<Record<string, string>>({});

	/** Error del cliente si lo hay; si no, el que devolvió el servidor. Ambos son claves de traducción. */
	function errorFor(field: 'email' | 'password'): string | null {
		const message = clientErrors[field] ?? form?.fieldErrors[field];
		return message ? msg(message) : null;
	}

	function validate(): boolean {
		const parsed = loginSchema.safeParse({ email, password });
		const next: Record<string, string> = {};
		if (!parsed.success) {
			for (const issue of parsed.error.issues) {
				const key = String(issue.path[0] ?? '');
				if (key && !(key in next)) next[key] = issue.message;
			}
		}
		clientErrors = next;
		return parsed.success;
	}

	function onSubmit(event: SubmitEvent) {
		if (!validate()) event.preventDefault();
	}
</script>

<form method="POST" class="auth-form" novalidate onsubmit={onSubmit}>
	<Field label={t('auth.email')} id="email" error={errorFor('email')}>
		{#snippet children({ id, invalid, describedBy })}
			<Input
				{id}
				{invalid}
				name="email"
				type="email"
				autocomplete="email"
				placeholder={t('auth.email.placeholder')}
				aria-describedby={describedBy}
				bind:value={email}
			/>
		{/snippet}
	</Field>

	<Field label={t('auth.password')} id="password" error={errorFor('password')}>
		{#snippet children({ id, invalid, describedBy })}
			<Input
				{id}
				{invalid}
				name="password"
				type="password"
				autocomplete="current-password"
				placeholder="••••••••"
				aria-describedby={describedBy}
				bind:value={password}
			/>
		{/snippet}
	</Field>

	<Button type="submit" size="lg" block>{t('auth.submit')}</Button>
</form>
