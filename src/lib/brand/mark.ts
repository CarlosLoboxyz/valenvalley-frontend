/**
 * Fuente única de verdad del logo de CuadraMás.
 * La consumen `BrandMark.svelte` (UI) y `scripts/generate-icons.mjs` (favicon,
 * apple-touch-icon y manifest), de modo que el ícono del navegador nunca se
 * desincroniza del logo de la aplicación.
 */
export const BRAND_NAME = 'CuadraMás';

export const BRAND_COLORS = {
	tile: '#091242',
	stroke: '#fe6703',
	dot: '#ffd550'
} as const;

export const MARK = {
	viewBox: 32,
	tile: { x: 1, y: 1, size: 30, radius: 8 },
	path: 'M8 20.5 14 14.5l3.5 3.5 6.5-6.5',
	strokeWidth: 2.6,
	dot: { cx: 24, cy: 11, r: 2.6 }
} as const;

interface MarkSvgOptions {
	/** Cuadrado a sangre completa (sin esquinas transparentes): apple-touch-icon y maskable. */
	fullBleed?: boolean;
	/** Escala del trazo respecto al lienzo (zona segura para íconos maskable). */
	scale?: number;
	/** Grosor extra para que el trazo se lea en tamaños de 16 px. */
	strokeBoost?: number;
}

/** SVG autónomo del logo (sin texto), listo para `static/icon.svg` o para rasterizar. */
export function markSvg({ fullBleed = false, scale = 1, strokeBoost = 0 }: MarkSvgOptions = {}): string {
	const { viewBox, tile, path, strokeWidth, dot } = MARK;
	const offset = (viewBox * (1 - scale)) / 2;
	const background = fullBleed
		? `<rect width="${viewBox}" height="${viewBox}" fill="${BRAND_COLORS.tile}"/>`
		: `<rect x="${tile.x}" y="${tile.y}" width="${tile.size}" height="${tile.size}" rx="${tile.radius}" fill="${BRAND_COLORS.tile}"/>`;

	return [
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBox} ${viewBox}" fill="none">`,
		background,
		`<g transform="translate(${offset} ${offset}) scale(${scale})">`,
		`<path d="${path}" stroke="${BRAND_COLORS.stroke}" stroke-width="${strokeWidth + strokeBoost}" stroke-linecap="round" stroke-linejoin="round"/>`,
		`<circle cx="${dot.cx}" cy="${dot.cy}" r="${dot.r + strokeBoost / 2}" fill="${BRAND_COLORS.dot}"/>`,
		'</g>',
		'</svg>'
	].join('');
}
