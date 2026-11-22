import * as XLSX from 'xlsx';
import { hasNoSupplier } from '$lib/domain/labels';
import { formatMoqLabel, tierLabel } from '$lib/i18n/display';
import { translate, translateFlag, type Locale } from '$lib/i18n';
import type { SourcingReport } from '$lib/types/sourcing';

/** Los encabezados, nombres de hoja y valores enumerados son SIEMPRE es-VE para que el esquema sea estable. */
const STABLE_LOCALE: Locale = 'es-VE';

/**
 * Genera el libro de 4 hojas para el cliente (equivale a `output/final_recommendations.xlsx`):
 * 1. Recomendaciones
 * 2. Plan_Busqueda_Familias
 * 3. Proveedores_Cruzados
 * 4. Descalificados
 *
 * Contrato de datos: encabezados ASCII en español (snake_case), cantidades y precios como
 * números. Solo el texto libre (alertas y motivos) sigue el idioma activo de la interfaz.
 */
export function buildRecommendationsWorkbookBuffer(
	report: SourcingReport,
	locale: Locale = STABLE_LOCALE
): ArrayBuffer {
	const wb = XLSX.utils.book_new();

	// Hoja 1: Recomendaciones
	const recRows = report.recommendations.map((r) => ({
		Posicion: r.pos,
		Familia: r.family,
		Nombre_Familia: r.familyName,
		Producto: r.product,
		Cantidad: r.qtyNumeric,
		Unidad: r.unit,
		Presupuesto_Min: r.minPrice,
		Presupuesto_Max: r.maxPrice,
		Proveedor_Principal: hasNoSupplier(r.supplier)
			? translate(STABLE_LOCALE, 'common.noQualifyingSupplier')
			: r.supplier,
		Precio_Listado: r.price,
		MOQ: formatMoqLabel(STABLE_LOCALE, r.moqLabel),
		Anios_Activo: r.yearsActive ?? translate(STABLE_LOCALE, 'common.unknown'),
		Trade_Assurance: r.hasTradeAssurance ? 'Si' : 'No',
		Certificaciones: r.certifications.join(', ') || 'Ninguna',
		Puntaje_Proveedor: r.breakdown.vendorScore,
		Puntaje_Ajuste_RFQ: r.breakdown.rfqFitScore,
		Puntaje_Final: r.score,
		Nivel: tierLabel(STABLE_LOCALE, r.tier),
		Proveedores_Calificados: r.vendors,
		Advertencias: r.warnings.map((w) => translateFlag(locale, w)).join(' | ')
	}));
	XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recRows), 'Recomendaciones');

	// Hoja 2: Plan_Busqueda_Familias
	const familyRows = report.families.map((f) => ({
		ID_Familia: f.familyId,
		Nombre_Familia: f.name,
		Consulta_Busqueda: f.searchQuery,
		Cantidad_Items: f.itemCount,
		Posiciones: f.positions.join(', '),
		Cohesion_Pct: f.cohesionScore,
		Precio_Objetivo_Prom: f.avgPrice
	}));
	XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(familyRows), 'Plan_Busqueda_Familias');

	// Hoja 3: Proveedores_Cruzados
	const vendorRows = report.crossItemVendors.map((v) => ({
		Proveedor: v.supplier,
		Productos_Cubiertos: v.products.length,
		Familias_Cubiertas: v.familiesCovered.join(', '),
		Puntaje_Promedio: v.average,
		Posiciones: v.products.map((p) => p.pos).join(', ')
	}));
	XLSX.utils.book_append_sheet(
		wb,
		XLSX.utils.json_to_sheet(
			vendorRows.length > 0
				? vendorRows
				: [{ Nota: 'No se encontraron proveedores con varios ítems para consolidar' }]
		),
		'Proveedores_Cruzados'
	);

	// Hoja 4: Descalificados
	const disqRows = report.disqualified.map((d) => ({
		Posicion: d.position,
		Producto: d.product,
		Proveedor: d.supplier,
		Motivos_Descalificacion: d.reasons.map((reason) => translateFlag(locale, reason)).join(' | ')
	}));
	XLSX.utils.book_append_sheet(
		wb,
		XLSX.utils.json_to_sheet(
			disqRows.length > 0
				? disqRows
				: [{ Nota: 'No hay ofertas descalificadas con los filtros activos' }]
		),
		'Descalificados'
	);

	const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer | Uint8Array;
	return out instanceof Uint8Array
		? (out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer)
		: out;
}

export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}

/** El JSON conserva la estructura completa del reporte (alertas como código + parámetros). */
export function exportReportAsJson(report: SourcingReport): void {
	const json = JSON.stringify(report, null, 2);
	downloadBlob(new Blob([json], { type: 'application/json' }), 'final_recommendations.json');
}

export function exportReportAsExcel(report: SourcingReport, locale: Locale = STABLE_LOCALE): void {
	const buffer = buildRecommendationsWorkbookBuffer(report, locale);
	downloadBlob(
		new Blob([buffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		}),
		'final_recommendations.xlsx'
	);
}
