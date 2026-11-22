import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseMaterialsData, toNumber } from '$lib/services/file-ingest';

function makeSheet(rows: unknown[][]): ArrayBuffer {
	const ws = XLSX.utils.aoa_to_sheet(rows);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
	return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

function makeCsv(rows: unknown[][]): ArrayBuffer {
	const ws = XLSX.utils.aoa_to_sheet(rows);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
	return XLSX.write(wb, { type: 'array', bookType: 'csv' }) as ArrayBuffer;
}

describe('toNumber', () => {
	it('convierte cadenas con formato', () => {
		expect(toNumber('1,500')).toBe(1500);
		expect(toNumber('$189.50')).toBe(189.5);
		expect(toNumber(' 42 ')).toBe(42);
	});

	it('devuelve NaN para valores no numéricos', () => {
		expect(toNumber('abc')).toBeNaN();
		expect(toNumber('')).toBeNaN();
	});
});

describe('parseMaterialsData', () => {
	it('parsea filas válidas y limpia encabezados', () => {
		const buffer = makeSheet([
			[' name ', ' qty ', ' unit '],
			['Tornillos 3/8', 200, 'und'],
			['Cable HDMI', 50, 'pieces']
		]);
		const result = parseMaterialsData(buffer);
		expect(result.total).toBe(2);
		expect(result.valid).toHaveLength(2);
		expect(result.errors).toHaveLength(0);
		expect(result.valid[0].unit).toBe('pieces');
		expect(result.valid[0].qty).toBe(200);
		expect(result.valid[0].name).toBe('Tornillos 3/8');
	});

	it('normaliza el encabezado " max price" y valida precios', () => {
		const buffer = makeSheet([
			['name', 'qty', 'unit', ' max price', 'min price'],
			['Fuente ATX', 10, 'units', 45.5, 40]
		]);
		const result = parseMaterialsData(buffer);
		expect(result.valid).toHaveLength(1);
		expect(result.valid[0]['max price']).toBe(45.5);
		expect(result.valid[0]['min price']).toBe(40);
	});

	it('lee archivos CSV', () => {
		const buffer = makeCsv([
			['name', 'qty', 'unit'],
			['Tornillos', '200', 'pairs']
		]);
		const result = parseMaterialsData(buffer);
		expect(result.valid).toHaveLength(1);
		expect(result.valid[0].qty).toBe(200);
		expect(result.valid[0].unit).toBe('pairs');
	});

	it('registra errores por qty negativa o no numérica', () => {
		const buffer = makeSheet([
			['name', 'qty', 'unit'],
			['Tornillos', -5, 'pieces'],
			['Cable', 'abc', 'pieces'],
			['Gabinete', 3, 'packs']
		]);
		const result = parseMaterialsData(buffer);
		expect(result.valid).toHaveLength(1);
		expect(result.errors).toHaveLength(2);
		expect(result.errors.every((e) => e.column === 'qty')).toBe(true);
	});

	it('registra errores por unidad inválida', () => {
		const buffer = makeSheet([
			['name', 'qty', 'unit'],
			['Tornillos', 10, 'galones']
		]);
		const result = parseMaterialsData(buffer);
		expect(result.valid).toHaveLength(0);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].column).toBe('unit');
	});

	it('reporta ausencia de columnas obligatorias', () => {
		const buffer = makeSheet([
			['name', 'qty'],
			['Tornillos', 10]
		]);
		const result = parseMaterialsData(buffer);
		expect(result.valid).toHaveLength(0);
		expect(
			result.errors.some((e) => e.message === 'ingest.missingColumn' && e.params?.column === 'unit')
		).toBe(true);
	});

	it('los motivos de error son claves de traducción, no frases', () => {
		const buffer = makeSheet([
			['name', 'qty', 'unit'],
			['Cable', -2, 'galones']
		]);
		const { errors } = parseMaterialsData(buffer);
		expect(errors.map((e) => e.message).sort()).toEqual([
			'validation.qty.positive',
			'validation.unit.invalid'
		]);
	});

	it('escribe en el reporte la fila, columna y valor problemáticos', () => {
		const buffer = makeSheet([
			['name', 'qty', 'unit'],
			['Cable HDMI', 'abc', 'pieces']
		]);
		const result = parseMaterialsData(buffer);
		expect(result.errors[0]).toMatchObject({
			row: 1,
			column: 'qty',
			value: 'abc'
		});
	});
});
