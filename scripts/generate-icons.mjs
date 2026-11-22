/**
 * Genera los activos del navegador (favicon, apple-touch-icon, íconos del manifest)
 * a partir de la geometría única del logo en `src/lib/brand/mark.ts`.
 *
 * Requiere `rsvg-convert` (librsvg). El contenedor .ico se escribe a mano
 * (PNG incrustado), así que no hace falta ninguna dependencia de npm.
 *
 *   npm run icons
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markSvg } from '../src/lib/brand/mark.ts';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const out = join(root, 'static');
mkdirSync(out, { recursive: true });

const work = mkdtempSync(join(tmpdir(), 'cuadramas-icons-'));

function rasterize(svg, size, name) {
	const source = join(work, `${name}.svg`);
	const target = join(work, `${name}.png`);
	writeFileSync(source, svg);
	execFileSync('rsvg-convert', ['-w', String(size), '-h', String(size), source, '-o', target]);
	return readFileSync(target);
}

/** Empaqueta PNGs en un .ico (formato PNG-in-ICO, válido desde Windows Vista). */
function packIco(images) {
	const header = Buffer.alloc(6);
	header.writeUInt16LE(0, 0);
	header.writeUInt16LE(1, 2);
	header.writeUInt16LE(images.length, 4);

	let offset = 6 + images.length * 16;
	const entries = images.map(({ size, data }) => {
		const entry = Buffer.alloc(16);
		entry.writeUInt8(size >= 256 ? 0 : size, 0);
		entry.writeUInt8(size >= 256 ? 0 : size, 1);
		entry.writeUInt8(0, 2);
		entry.writeUInt8(0, 3);
		entry.writeUInt16LE(1, 4);
		entry.writeUInt16LE(32, 6);
		entry.writeUInt32LE(data.length, 8);
		entry.writeUInt32LE(offset, 12);
		offset += data.length;
		return entry;
	});

	return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

try {
	const rounded = markSvg();
	const small = markSvg({ strokeBoost: 0.8 });
	const fullBleed = markSvg({ fullBleed: true, scale: 1.12 });
	const maskable = markSvg({ fullBleed: true, scale: 0.92 });

	writeFileSync(join(out, 'icon.svg'), `${rounded}\n`);

	const ico = packIco([
		{ size: 16, data: rasterize(small, 16, 'ico-16') },
		{ size: 32, data: rasterize(small, 32, 'ico-32') },
		{ size: 48, data: rasterize(rounded, 48, 'ico-48') }
	]);
	writeFileSync(join(out, 'favicon.ico'), ico);

	writeFileSync(join(out, 'apple-icon.png'), rasterize(fullBleed, 180, 'apple'));
	writeFileSync(join(out, 'icon-192.png'), rasterize(rounded, 192, 'icon-192'));
	writeFileSync(join(out, 'icon-512.png'), rasterize(rounded, 512, 'icon-512'));
	writeFileSync(join(out, 'icon-maskable-512.png'), rasterize(maskable, 512, 'maskable'));

	console.log('Íconos generados en static/: icon.svg, favicon.ico, apple-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png');
} finally {
	rmSync(work, { recursive: true, force: true });
}
