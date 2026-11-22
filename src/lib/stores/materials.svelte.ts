import type { IngestError, ManualItem, MaterialRow } from '$lib/schemas/materials';
import type { RfqItemInput } from '$lib/services/backend/types';
import { buildRfqItems } from '$lib/services/rfq-items';

export interface FileIngestState {
	fileName: string;
	validCount: number;
	errors: IngestError[];
	/** Filas válidas ya parseadas: son las que se envían al backend. */
	rows: MaterialRow[];
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
	/** Total de ítems (archivo + manuales) que se enviarán. */
	totalItems = $derived(this.manualItems.length + (this.file?.validCount ?? 0));

	addItem(item: ManualItem): void {
		this.manualItems.push(item);
	}

	removeItem(id: string): void {
		this.manualItems = this.manualItems.filter((item) => item.id !== id);
	}

	setFileReport(report: FileIngestState): void {
		this.file = report;
	}

	/** Lista canónica (archivo + manual) para `POST /rfq/items`. */
	toRfqItems(): RfqItemInput[] {
		return buildRfqItems(this.file?.rows ?? [], this.manualItems);
	}

	/** Nombre de la lista: el del archivo, o `null` si sólo hay ítems manuales. */
	listName(): string | null {
		return this.file ? this.file.fileName.replace(/\.(csv|xlsx)$/i, '') : null;
	}

	reset(): void {
		this.manualItems = [];
		this.file = null;
	}
}

export const materialsStore = new MaterialsState();
