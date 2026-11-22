<script module lang="ts">
	export type IconName =
		| 'arrow-down-right'
		| 'arrow-up-right'
		| 'bell'
		| 'chevron-down'
		| 'chevron-left'
		| 'chevron-right'
		| 'circle-help'
		| 'download'
		| 'external-link'
		| 'file-spreadsheet'
		| 'filter'
		| 'layout-dashboard'
		| 'log-out'
		| 'play'
		| 'rotate-ccw'
		| 'search'
		| 'settings'
		| 'shield-alert'
		| 'shopping-bag'
		| 'sliders'
		| 'sparkles'
		| 'truck'
		| 'upload'
		| 'x'
		| 'sun'
		| 'moon'
		| 'zap';
</script>

<script lang="ts">
	interface Props {
		name: IconName;
		size?: number;
		class?: string;
		color?: string;
	}

	let { name, size = 16, class: className = '', color = 'currentColor' }: Props = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke={color}
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
	aria-hidden="true"
>
	{#if name === 'shopping-bag'}
		<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
		<path d="M3 6h18" />
		<path d="M16 10a4 4 0 0 1-8 0" />
	{:else if name === 'log-out'}
		<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
		<polyline points="16 17 21 12 16 7" />
		<line x1="21" x2="9" y1="12" y2="12" />
	{:else if name === 'layout-dashboard'}
		<rect width="7" height="9" x="3" y="3" rx="1" />
		<rect width="7" height="5" x="14" y="3" rx="1" />
		<rect width="7" height="9" x="14" y="12" rx="1" />
		<rect width="7" height="5" x="3" y="16" rx="1" />
	{:else if name === 'truck'}
		<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
		<path d="M15 18H9" />
		<path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
		<circle cx="17" cy="18" r="2" />
		<circle cx="7" cy="18" r="2" />
	{:else if name === 'circle-help'}
		<circle cx="12" cy="12" r="10" />
		<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
		<path d="M12 17h.01" />
	{:else if name === 'external-link'}
		<path d="M15 3h6v6" />
		<path d="M10 14 21 3" />
		<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
	{:else if name === 'settings'}
		<path d="M20 7h-9" />
		<path d="M14 17H5" />
		<circle cx="17" cy="17" r="3" />
		<circle cx="7" cy="7" r="3" />
	{:else if name === 'bell'}
		<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
		<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
	{:else if name === 'download'}
		<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
		<polyline points="7 10 12 15 17 10" />
		<line x1="12" x2="12" y1="15" y2="3" />
	{:else if name === 'zap'}
		<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
	{:else if name === 'sparkles'}
		<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
	{:else if name === 'shield-alert'}
		<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
		<path d="M12 8v4" />
		<path d="M12 16h.01" />
	{:else if name === 'arrow-up-right'}
		<path d="M7 7h10v10" />
		<path d="M7 17 17 7" />
	{:else if name === 'arrow-down-right'}
		<path d="m7 7 10 10" />
		<path d="M17 7v10H7" />
	{:else if name === 'search'}
		<circle cx="11" cy="11" r="8" />
		<path d="m21 21-4.3-4.3" />
	{:else if name === 'filter'}
		<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
	{:else if name === 'chevron-down'}
		<path d="m6 9 6 6 6-6" />
	{:else if name === 'chevron-left'}
		<path d="m15 18-6-6 6-6" />
	{:else if name === 'chevron-right'}
		<path d="m9 18 6-6-6-6" />
	{:else if name === 'sliders'}
		<line x1="4" x2="4" y1="21" y2="14" />
		<line x1="4" x2="4" y1="10" y2="3" />
		<line x1="12" x2="12" y1="21" y2="12" />
		<line x1="12" x2="12" y1="8" y2="3" />
		<line x1="20" x2="20" y1="21" y2="16" />
		<line x1="20" x2="20" y1="12" y2="3" />
		<line x1="2" x2="6" y1="14" y2="14" />
		<line x1="10" x2="14" y1="8" y2="8" />
		<line x1="18" x2="22" y1="16" y2="16" />
	{:else if name === 'upload'}
		<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
		<polyline points="17 8 12 3 7 8" />
		<line x1="12" x2="12" y1="3" y2="15" />
	{:else if name === 'file-spreadsheet'}
		<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
		<path d="M14 2v4a2 2 0 0 0 2 2h4" />
		<path d="M8 13h2" />
		<path d="M14 13h2" />
		<path d="M8 17h2" />
		<path d="M14 17h2" />
	{:else if name === 'play'}
		<polygon points="6 3 20 12 6 21 6 3" />
	{:else if name === 'x'}
		<path d="M18 6 6 18" />
		<path d="m6 6 12 12" />
	{:else if name === 'sun'}
		<circle cx="12" cy="12" r="4" />
		<path d="M12 2v2" />
		<path d="M12 20v2" />
		<path d="m4.93 4.93 1.41 1.41" />
		<path d="m17.66 17.66 1.41 1.41" />
		<path d="M2 12h2" />
		<path d="M20 12h2" />
		<path d="m6.34 17.66-1.41 1.41" />
		<path d="m19.07 4.93-1.41 1.41" />
	{:else if name === 'moon'}
		<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
	{:else if name === 'rotate-ccw'}
		<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
		<path d="M3 3v5h5" />
	{/if}
</svg>
