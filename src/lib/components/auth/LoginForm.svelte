<script lang="ts">
	import { untrack } from 'svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import {
		loginSchema,
		signupSchema,
		type LoginFieldErrors
	} from '$lib/schemas/auth';
	import { usePreferences } from '$lib/stores/preferences.svelte';

	interface Props {
		form?: LoginFieldErrors | null;
		/** `login` (por defecto) o `signup` (añade confirmación de contraseña). */
		mode?: 'login' | 'signup';
	}

	let { form, mode = 'login' }: Props = $props();

	const { t, msg } = usePreferences();

	type FieldName = 'email' | 'password' | 'passwordConfirm';

	let email = $state(untrack(() => form?.email ?? ''));
	let password = $state('');
	let passwordConfirm = $state('');
	let clientErrors = $state<Record<string, string>>({});

	/** Error del cliente si lo hay; si no, el que devolvió el servidor. Ambos son claves de traducción. */
	function errorFor(field: FieldName): string | null {
		const message = clientErrors[field] ?? form?.fieldErrors?.[field];
		return message ? msg(message) : null;
	}

	function validate(): boolean {
		const parsed =
			mode === 'signup'
				? signupSchema.safeParse({ email, password, passwordConfirm })
				: loginSchema.safeParse({ email, password });
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
	{#if form?.formError}
		<Alert tone="error">{msg(form.formError)}</Alert>
	{/if}

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
				autocomplete={mode === 'signup' ? 'new-password' : 'current-password'}
				placeholder="••••••••"
				aria-describedby={describedBy}
				bind:value={password}
			/>
		{/snippet}
	</Field>

	{#if mode === 'signup'}
		<Field label={t('auth.passwordConfirm')} id="passwordConfirm" error={errorFor('passwordConfirm')}>
			{#snippet children({ id, invalid, describedBy })}
				<Input
					{id}
					{invalid}
					name="passwordConfirm"
					type="password"
					autocomplete="new-password"
					placeholder="••••••••"
					aria-describedby={describedBy}
					bind:value={passwordConfirm}
				/>
			{/snippet}
		</Field>
	{/if}

	<Button type="submit" size="lg" block>
		{mode === 'signup' ? t('auth.signup.submit') : t('auth.submit')}
	</Button>
</form>
