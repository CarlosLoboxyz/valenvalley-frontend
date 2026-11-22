import * as XLSX from 'xlsx';
import type { SourcingReport } from '$lib/types/sourcing';

/**
 * Generates the 4-tab client-ready Excel workbook matching `output/final_recommendations.xlsx`:
 * 1. Recommendations
 * 2. Family_Search_Plan
 * 3. Cross_Item_Vendors
 * 4. Disqualified
 */
export function buildRecommendationsWorkbookBuffer(report: SourcingReport): ArrayBuffer {
	const wb = XLSX.utils.book_new();

	// Tab 1: Recommendations
	const recRows = report.recommendations.map((r) => ({
		Position: r.pos,
		Family: r.family,
		Family_Name: r.familyName,
		Product: r.product,
		Qty: r.qty,
		Budget: r.budget,
		Top_Supplier: r.supplier,
		Listed_Price: r.price,
		MOQ: r.moqLabel,
		Years_Active: r.yearsActive ?? 'Unknown',
		Trade_Assurance: r.hasTradeAssurance ? 'Yes' : 'No',
		Certifications: r.certifications.join(', ') || 'None',
		Vendor_Score: r.breakdown.vendorScore,
		RFQ_Fit_Score: r.breakdown.rfqFitScore,
		Final_Score: r.score,
		Tier: r.tier,
		Qualified_Vendors: r.vendors,
		Warnings: r.warnings.join(' | ')
	}));
	XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recRows), 'Recommendations');

	// Tab 2: Family_Search_Plan
	const familyRows = report.families.map((f) => ({
		Family_ID: f.familyId,
		Family_Name: f.name,
		Search_Query: f.searchQuery,
		Item_Count: f.itemCount,
		Positions: f.positions.join(', '),
		Cohesion_Pct: `${f.cohesionScore}%`,
		Avg_Target_Price: f.avgPrice !== null ? `$${f.avgPrice.toFixed(2)}` : 'N/A'
	}));
	XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(familyRows), 'Family_Search_Plan');

	// Tab 3: Cross_Item_Vendors
	const vendorRows = report.crossItemVendors.map((v) => ({
		Supplier: v.supplier,
		Products_Covered: v.products.length,
		Families_Covered: v.familiesCovered.join(', '),
		Average_Score: v.average,
		Positions: v.products.map((p) => p.pos).join(', ')
	}));
	XLSX.utils.book_append_sheet(
		wb,
		XLSX.utils.json_to_sheet(
			vendorRows.length > 0 ? vendorRows : [{ Note: 'No multi-item consolidation vendors found' }]
		),
		'Cross_Item_Vendors'
	);

	// Tab 4: Disqualified
	const disqRows = report.disqualified.map((d) => ({
		Position: d.position,
		Product: d.product,
		Supplier: d.supplier,
		Disqualification_Reasons: d.reasons.join(' | ')
	}));
	XLSX.utils.book_append_sheet(
		wb,
		XLSX.utils.json_to_sheet(
			disqRows.length > 0 ? disqRows : [{ Note: 'No disqualified listings under active filters' }]
		),
		'Disqualified'
	);

	const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer | Uint8Array;
	return out instanceof Uint8Array
		? out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength)
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

export function exportReportAsJson(report: SourcingReport): void {
	const json = JSON.stringify(report, null, 2);
	downloadBlob(new Blob([json], { type: 'application/json' }), 'final_recommendations.json');
}

export function exportReportAsExcel(report: SourcingReport): void {
	const buffer = buildRecommendationsWorkbookBuffer(report);
	downloadBlob(
		new Blob([buffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		}),
		'final_recommendations.xlsx'
	);
}
