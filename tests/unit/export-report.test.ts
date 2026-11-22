import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { createInitialSourcingReport } from '$lib/data/sample-report';
import { buildRecommendationsWorkbookBuffer } from '$lib/modules/export-report';

function read(locale: 'es-VE' | 'en') {
	const report = createInitialSourcingReport();
	const wb = XLSX.read(buildRecommendationsWorkbookBuffer(report, locale), { type: 'array' });
	return { report, wb };
}

describe('exportación a Excel', () => {
	it('usa nombres de hoja estables en es-VE', () => {
		const { wb } = read('es-VE');
		expect(wb.SheetNames).toEqual([
			'Recomendaciones',
			'Plan_Busqueda_Familias',
			'Proveedores_Cruzados',
			'Descalificados'
		]);
	});

	it('los encabezados no cambian con el idioma de la interfaz', () => {
		const headersOf = (locale: 'es-VE' | 'en') => {
			const { wb } = read(locale);
			return Object.fromEntries(
				wb.SheetNames.map((name) => [
					name,
					(XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1 })[0] as string[]) ?? []
				])
			);
		};
		expect(headersOf('en')).toEqual(headersOf('es-VE'));
		expect(headersOf('es-VE').Recomendaciones.slice(0, 6)).toEqual([
			'Posicion',
			'Familia',
			'Nombre_Familia',
			'Producto',
			'Cantidad',
			'Unidad'
		]);
	});

	it('exporta cantidades y precios como números, no como texto', () => {
		const { wb, report } = read('es-VE');
		const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets.Recomendaciones);
		expect(typeof rows[0].Cantidad).toBe('number');
		expect(rows[0].Cantidad).toBe(report.recommendations[0].qtyNumeric);
		expect(typeof rows[0].Puntaje_Final).toBe('number');
	});

	it('el nivel es un valor es-VE estable; las advertencias siguen el idioma activo', () => {
		const es = XLSX.utils.sheet_to_json<Record<string, string>>(read('es-VE').wb.Sheets.Recomendaciones);
		const en = XLSX.utils.sheet_to_json<Record<string, string>>(read('en').wb.Sheets.Recomendaciones);
		expect(es[0].Nivel).toBe(en[0].Nivel);
		expect(['Muy recomendado', 'Considerar', 'Precaución', 'Descalificado']).toContain(es[0].Nivel);
		expect(es[0].Advertencias).toContain('MOQ sin confirmar');
		expect(en[0].Advertencias).toContain('MOQ not confirmed');
	});
});
