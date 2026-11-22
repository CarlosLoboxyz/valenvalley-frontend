<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		invalid?: boolean;
	}

	let { value = $bindable(), invalid = false, class: className = '', ...rest }: Props = $props();
</script>

<input
	class={['input', invalid ? 'is-invalid' : '', className].filter(Boolean).join(' ')}
	aria-invalid={invalid ? 'true' : undefined}
	bind:value
	{...rest}
/>
