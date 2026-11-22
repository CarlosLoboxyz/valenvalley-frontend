/**
 * Valores centinela del dominio. Se guardan tal cual en el reporte (y en el JSON exportado);
 * la interfaz los traduce al mostrarlos (ver `$lib/i18n/display.ts`).
 */
export const SOURCE_CONSOLIDATED = 'consolidated';
export const SOURCE_LOCAL_VALIDATION = 'local-validation';
export const SOURCE_UPLOADED_PREFIX = 'uploaded:';

export function sourceUploaded(fileName: string): string {
	return `${SOURCE_UPLOADED_PREFIX}${fileName}`;
}

export const MOQ_UNCONFIRMED = 'Unconfirmed';
export const MOQ_NOT_AVAILABLE = 'N/A';

/** Texto que usaban los reportes anteriores cuando ninguna oferta calificaba. */
export const LEGACY_NO_SUPPLIER = 'No qualifying supplier';

export function hasNoSupplier(supplier: string): boolean {
	return supplier === '' || supplier === LEGACY_NO_SUPPLIER;
}
