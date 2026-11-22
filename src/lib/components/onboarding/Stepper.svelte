<script lang="ts">
	import type { MessageKey } from '$lib/i18n';
	import { usePreferences } from '$lib/stores/preferences.svelte';
	import type { OnboardingStep } from '$lib/stores/onboarding.svelte';

	let { step }: { step: OnboardingStep } = $props();

	const { t } = usePreferences();

	const STEPS: Array<{ id: OnboardingStep; label: MessageKey }> = [
		{ id: 'load', label: 'onboarding.step.load' },
		{ id: 'review', label: 'onboarding.step.review' },
		{ id: 'progress', label: 'onboarding.step.progress' },
		{ id: 'result', label: 'onboarding.step.result' }
	];

	const current = $derived(STEPS.findIndex((s) => s.id === step));
</script>

<ol class="stepper" aria-label={t('onboarding.step.aria')}>
	{#each STEPS as item, index (item.id)}
		<li
			class="stepper__item"
			class:is-done={index < current}
			class:is-current={index === current}
			aria-current={index === current ? 'step' : undefined}
		>
			<span class="stepper__dot">{index + 1}</span>
			<span class="stepper__label">{t(item.label)}</span>
		</li>
	{/each}
</ol>
