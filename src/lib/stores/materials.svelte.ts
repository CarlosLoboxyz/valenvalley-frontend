import type { IngestError, ManualItem } from '$lib/schemas/materials';

export interface FileIngestState {
	fileName: string;
	validCount: number;
	errors: IngestError[];
}

/**
 * Estado (runes) de la pantalla de ingesta de materiales. Mantiene la lista
 * manual y el reporte de la carga por archivo de forma reactiva.
 */
class MaterialsState {
	manualItems = $state<ManualItem[]>([]);
	file = $state<FileIngestState | null>(null);

	manualCount = $derived(this.manualItems.length);
	totalUnits = $derived(this.manualItems.reduce((acc, item) => acc + item.qty, 0));
	canContinue = $derived(this.manualItems.length > 0 || (this.file?.validCount ?? 0) > 0);

	addItem(item: ManualItem): void {
		this.manualItems.push(item);
	}

	removeItem(id: string): void {
		this.manualItems = this.manualItems.filter((item) => item.id !== id);
	}

	setFileReport(report: FileIngestState): void {
		this.file = report;
	}

	reset(): void {
		this.manualItems = [];
		this.file = null;
	}
}

export const materialsStore = new MaterialsState();
