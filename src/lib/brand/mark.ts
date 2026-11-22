/**
 * Fuente única de verdad del logo de ProcuraMAX.
 * La consumen `BrandMark.svelte` (UI) y `scripts/generate-icons.mjs` (favicon,
 * apple-touch-icon y manifest), de modo que el ícono del navegador nunca se
 * desincroniza del logo de la aplicación.
 */
export const BRAND_NAME = 'ProcuraMAX';

export const BRAND_COLORS = {
	tile: '#273270',
	mark: '#ffffff',
	accent: '#fe6703'
} as const;

export const MARK = {
	viewBox: 48,
	tile: { x: 2, y: 2, size: 44, radius: 12 },
	letters: 'M12 22 L24 16 L36 22 L36 34 L24 40 L12 34 Z M12 22 L24 28 L36 22 M24 28 L24 40',
	lettersStrokeWidth: 2.6,
	accent: 'M27 13 L37 7 M37 7 L31 6.5 M37 7 L36.5 13',
	accentStrokeWidth: 3,
	dot: { cx: 24, cy: 28, r: 2.6 }
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
	const { viewBox, tile, letters, lettersStrokeWidth, accent, accentStrokeWidth, dot } = MARK;
	const offset = (viewBox * (1 - scale)) / 2;
	const background = fullBleed
		? `<rect width="${viewBox}" height="${viewBox}" fill="${BRAND_COLORS.tile}"/>`
		: `<rect x="${tile.x}" y="${tile.y}" width="${tile.size}" height="${tile.size}" rx="${tile.radius}" fill="${BRAND_COLORS.tile}"/>`;

	return [
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBox} ${viewBox}" fill="none">`,
		background,
		`<g transform="translate(${offset} ${offset}) scale(${scale})">`,
		`<path d="${letters}" fill="none" stroke="${BRAND_COLORS.mark}" stroke-width="${lettersStrokeWidth + strokeBoost}" stroke-linejoin="round"/>`,
		`<path d="${accent}" fill="none" stroke="${BRAND_COLORS.accent}" stroke-width="${accentStrokeWidth + strokeBoost}" stroke-linecap="round" stroke-linejoin="round"/>`,
		`<circle cx="${dot.cx}" cy="${dot.cy}" r="${dot.r + strokeBoost / 2}" fill="${BRAND_COLORS.accent}"/>`,
		'</g>',
		'</svg>'
	].join('');
}
