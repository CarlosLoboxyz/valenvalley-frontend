<script lang="ts">
	import type { Snippet } from 'svelte';

	interface ControlProps {
		id: string;
		invalid: boolean;
		describedBy: string | undefined;
	}

	interface Props {
		label: string;
		id: string;
		error?: string | null;
		hint?: string;
		class?: string;
		children: Snippet<[ControlProps]>;
	}

	let { label, id, error = null, hint, class: className = '', children }: Props = $props();

	const describedBy = $derived(error ? `${id}-error` : hint ? `${id}-hint` : undefined);
</script>

<div class={['field', className].filter(Boolean).join(' ')}>
	<label class="field__label" for={id}>{label}</label>
	{@render children({ id, invalid: Boolean(error), describedBy })}
	{#if error}
		<span class="field__error" id={`${id}-error`}>{error}</span>
	{:else if hint}
		<span class="field__hint" id={`${id}-hint`}>{hint}</span>
	{/if}
</div>
