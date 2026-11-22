import { z } from 'zod';

/*
 * Todos los mensajes de este archivo son CLAVES de traducción (`validation.*`): los esquemas
 * no dependen del idioma de la interfaz; la vista las traduce con `prefs.msg()`.
 */

/**
 * Unidades válidas del catálogo y de la lista manual (AGENTS.md / plataforma.md).
 * `und` y `unidad` se normalizan a `pieces` en `services/units.ts`.
 */
export const UNIT_VALUES = ['pieces', 'packs', 'kits', 'sets', 'pairs'] as const;

export const unitSchema = z.enum(UNIT_VALUES, { message: 'validation.unit.invalid' });

export type MaterialUnit = z.infer<typeof unitSchema>;

/**
 * Una fila ya parseada desde el archivo. Los nombres de columna ya están
 * normalizados (trim + minúsculas) antes de aplicar este esquema.
 */
export const materialRowSchema = z.object({
	name: z
		.string({ message: 'validation.name.required' })
		.trim()
		.min(1, 'validation.name.empty'),
	qty: z
		.number({ message: 'validation.qty.number' })
		.finite('validation.qty.finite')
		.int('validation.qty.integer')
		.positive('validation.qty.positive'),
	unit: unitSchema,
	position: z
		.number({ message: 'validation.position.number' })
		.int('validation.position.integer')
		.positive('validation.position.positive')
		.optional(),
	description: z.string().optional(),
	'min price': z
		.number({ message: 'validation.minPrice.number' })
		.nonnegative('validation.minPrice.negative')
		.optional(),
	'max price': z
		.number({ message: 'validation.maxPrice.number' })
		.nonnegative('validation.maxPrice.negative')
		.optional(),
	brand: z.string().optional(),
	'technical specs': z.string().optional()
});

export type MaterialRow = z.output<typeof materialRowSchema>;

/**
 * Error auditable: nunca se descarta una fila sin quedar registrada.
 * `message` es una clave de traducción; `params` aporta los valores variables.
 */
export const ingestErrorSchema = z.object({
	row: z.number().int().positive(),
	column: z.string(),
	value: z.string(),
	message: z.string(),
	params: z.record(z.string(), z.string()).optional()
});

export type IngestError = z.infer<typeof ingestErrorSchema>;

/**
 * Reporte de ingesta de un archivo: filas válidas + errores.
 */
export const ingestReportSchema = z.object({
	valid: z.array(materialRowSchema),
	errors: z.array(ingestErrorSchema)
});

export type IngestReport = z.infer<typeof ingestReportSchema>;

/**
 * Material agregado en la lista manual ("O ESCRÍBELA").
 */
export const manualItemSchema = z.object({
	id: z.string().min(1),
	name: z
		.string({ message: 'validation.manual.name' })
		.trim()
		.min(1, 'validation.manual.name'),
	qty: z
		.number({ message: 'validation.qty.number' })
		.int('validation.qty.integer')
		.positive('validation.qty.positive'),
	unit: unitSchema
});

export type ManualItem = z.infer<typeof manualItemSchema>;
