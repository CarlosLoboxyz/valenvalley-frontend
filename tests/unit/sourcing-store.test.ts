import { describe, it, expect } from 'vitest';
import { SourcingStore } from '$lib/stores/sourcing.svelte';
import { createInitialSourcingReport } from '../fixtures/sample-report';
import { ALL_FILTER } from '$lib/types/sourcing';

describe('SourcingStore', () => {
	it('sin reporte inicial arranca vacío: sin datos de ejemplo', () => {
		const store = new SourcingStore();
		expect(store.items).toHaveLength(0);
		expect(store.report.rfqItems).toHaveLength(0);
		expect(store.report.catalogName).toBe('');
		expect(store.noVendorCount).toBe(0);
	});

	it('las instancias no comparten estado', () => {
		const a = new SourcingStore(createInitialSourcingReport());
		const b = new SourcingStore();
		expect(a.items.length).toBeGreaterThan(0);
		expect(b.items).toHaveLength(0);
	});

	it('filtra por código de puntaje, no por texto traducido', () => {
		const store = new SourcingStore(createInitialSourcingReport());
		const total = store.filteredItems.length;

		store.scoreFilter = 'strong';
		expect(store.filteredItems.every((item) => item.score >= 75)).toBe(true);

		store.scoreFilter = 'review';
		expect(store.filteredItems.every((item) => item.issues >= 4)).toBe(true);

		store.scoreFilter = 'all';
		expect(store.filteredItems).toHaveLength(total);
	});

	it('filtra por familia y proveedor con el centinela ALL_FILTER', () => {
		const store = new SourcingStore(createInitialSourcingReport());
		const family = store.familyCodes[0];
		store.familyFilter = family;
		expect(store.filteredItems.length).toBeGreaterThan(0);
		expect(store.filteredItems.every((item) => item.family === family)).toBe(true);

		store.familyFilter = ALL_FILTER;
		store.supplierFilter = store.providers[0];
		expect(store.filteredItems.every((item) => item.supplier === store.providers[0])).toBe(true);
	});

	it('resetFilters restaura los códigos por defecto', () => {
		const store = new SourcingStore(createInitialSourcingReport());
		store.scoreFilter = 'review';
		store.familyFilter = 'FAM_01';
		store.resetFilters();
		expect([store.scoreFilter, store.familyFilter, store.supplierFilter]).toEqual([
			'all',
			ALL_FILTER,
			ALL_FILTER
		]);
	});

	it('las señales de calidad cuentan por código de alerta y exponen totales numéricos', () => {
		const store = new SourcingStore(createInitialSourcingReport());
		const signals = store.qualitySignals;
		expect(signals.map((s) => s.id)).toEqual(['moq', 'brand', 'price', 'tenure']);
		for (const signal of signals) {
			expect(signal.total).toBe(store.items.length);
			expect(signal.count).toBeLessThanOrEqual(signal.total);
		}
		const brand = store.items.filter((item) =>
			item.warnings.some((w) => w.code === 'W_BRAND_MISMATCH' || w.code === 'W_STRICT_BRAND_MISSING')
		).length;
		expect(signals.find((s) => s.id === 'brand')?.count).toBe(brand);
	});

	it('los mensajes de estado son claves con parámetros, no frases', () => {
		const store = new SourcingStore(createInitialSourcingReport());
		store.generateRfqDraft();
		expect(store.statusMessage?.key).toBe('status.rfqReady');
		expect(store.statusMessage?.params).toEqual({ count: store.report.crossItemVendors.length });
	});
});
