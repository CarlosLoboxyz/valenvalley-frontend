import { describe, it, expect } from 'vitest';
import { BRAND_COLORS, BRAND_NAME, markSvg } from '$lib/brand/mark';
import iconSvg from '../../static/icon.svg?raw';
import manifestRaw from '../../static/site.webmanifest?raw';

const staticAssets = Object.keys(import.meta.glob('../../static/*', { query: '?url' })).map(
	(path) => path.split('/').pop()
);

describe('marca CuadraMás', () => {
	it('el logo usa solo los colores de la paleta oficial', () => {
		const svg = markSvg();
		expect(svg).toContain(BRAND_COLORS.tile);
		expect(svg).toContain(BRAND_COLORS.stroke);
		expect(svg).toContain(BRAND_COLORS.dot);
		const hexes = svg.match(/#[0-9a-f]{6}/gi)?.map((hex) => hex.toLowerCase()) ?? [];
		expect(new Set(hexes)).toEqual(new Set(['#091242', '#fe6703', '#ffd550']));
	});

	it('el ícono a sangre completa no tiene esquinas redondeadas', () => {
		expect(markSvg({ fullBleed: true })).not.toContain('rx=');
		expect(markSvg()).toContain('rx=');
	});

	it('static/icon.svg está generado desde la misma geometría que el logo de la app', () => {
		expect(iconSvg.trim()).toBe(markSvg());
	});

	it('el manifest nombra la marca y apunta a íconos existentes', () => {
		const manifest = JSON.parse(manifestRaw) as { name: string; icons: { src: string }[] };
		expect(manifest.name).toBe(BRAND_NAME);
		for (const icon of manifest.icons) {
			expect(staticAssets, icon.src).toContain(icon.src.slice(1));
		}
	});

	it('existen todos los activos de navegador referenciados por app.html', () => {
		for (const file of ['favicon.ico', 'icon.svg', 'apple-icon.png', 'site.webmanifest']) {
			expect(staticAssets, file).toContain(file);
		}
	});
});
