<script lang="ts">
	import { BRAND_COLORS, BRAND_NAME, MARK } from '$lib/brand/mark';

	interface Props {
		/** Lado del ícono en px. */
		size?: number;
		/** Fuerza el filo claro del tile (sidebar y topbar son siempre oscuros); si no, lo decide el tema. */
		onDark?: boolean;
		/** Texto accesible; con `decorative` se oculta a lectores de pantalla. */
		decorative?: boolean;
	}

	let { size = 32, onDark = false, decorative = false }: Props = $props();
</script>

<svg
	class="brand-mark"
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox={`0 0 ${MARK.viewBox} ${MARK.viewBox}`}
	fill="none"
	role={decorative ? undefined : 'img'}
	aria-label={decorative ? undefined : BRAND_NAME}
	aria-hidden={decorative ? 'true' : undefined}
>
	<rect
		x={MARK.tile.x}
		y={MARK.tile.y}
		width={MARK.tile.size}
		height={MARK.tile.size}
		rx={MARK.tile.radius}
		fill={BRAND_COLORS.tile}
		style={onDark ? 'stroke: rgba(244, 244, 244, 0.22)' : 'stroke: var(--logo-tile-stroke, transparent)'}
	/>
	<path
		d={MARK.path}
		stroke={BRAND_COLORS.stroke}
		stroke-width={MARK.strokeWidth}
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
	<circle cx={MARK.dot.cx} cy={MARK.dot.cy} r={MARK.dot.r} fill={BRAND_COLORS.dot} />
</svg>

<style>
	.brand-mark {
		flex: none;
		display: block;
	}
</style>
