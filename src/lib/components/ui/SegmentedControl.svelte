<script lang="ts" generics="T extends string">
	import Icon, { type IconName } from './Icon.svelte';

	interface Option {
		value: T;
		label: string;
		icon?: IconName;
		/** Contador o marca pequeña a la derecha de la etiqueta. */
		badge?: string | number;
		/** Para `variant="tabs"`: id del botón y del panel que controla. */
		id?: string;
		controls?: string;
	}

	interface Props {
		options: Option[];
		value: T;
		onchange: (value: T) => void;
		/** Etiqueta accesible del grupo. */
		label: string;
		/** `tabs` usa semántica tablist con navegación por flechas; `group` son botones con aria-pressed. */
		variant?: 'tabs' | 'group';
		size?: 'sm' | 'md';
		tone?: 'default' | 'chrome';
		class?: string;
	}

	let {
		options,
		value,
		onchange,
		label,
		variant = 'group',
		size = 'md',
		tone = 'default',
		class: className = ''
	}: Props = $props();

	const isTabs = $derived(variant === 'tabs');

	function handleKeydown(event: KeyboardEvent, index: number) {
		if (!isTabs || (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft')) return;
		event.preventDefault();
		const delta = event.key === 'ArrowRight' ? 1 : -1;
		const next = options[(index + delta + options.length) % options.length];
		onchange(next.value);
		document.getElementById(next.id ?? '')?.focus();
	}
</script>

<div
	class={[
		'segmented',
		size === 'sm' ? 'segmented--sm' : '',
		tone === 'chrome' ? 'segmented--chrome' : '',
		className
	]
		.filter(Boolean)
		.join(' ')}
	role={isTabs ? 'tablist' : 'group'}
	aria-label={label}
>
	{#each options as option, index (option.value)}
		{@const active = option.value === value}
		<button
			type="button"
			class="segmented__item"
			class:is-active={active}
			id={option.id}
			role={isTabs ? 'tab' : undefined}
			aria-selected={isTabs ? active : undefined}
			aria-pressed={isTabs ? undefined : active}
			aria-controls={isTabs ? option.controls : undefined}
			tabindex={isTabs && !active ? -1 : 0}
			onclick={() => onchange(option.value)}
			onkeydown={(event) => handleKeydown(event, index)}
		>
			{#if option.icon}<Icon name={option.icon} size={15} />{/if}
			{option.label}
			{#if option.badge !== undefined}<span class="segmented__badge">{option.badge}</span>{/if}
		</button>
	{/each}
</div>
