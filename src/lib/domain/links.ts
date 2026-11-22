/**
 * Validación de enlaces a Alibaba. Solo se aceptan enlaces `https` bajo el dominio
 * canónico (incluidos los subdominios de tienda tipo `*.en.alibaba.com`). Todo lo demás
 * se considera «sin enlace verificado»: nunca se pinta un enlace roto ni uno fuera de Alibaba.
 */

/** ¿El hostname es exactamente `alibaba.com` o un subdominio de él? */
export function isAlibabaHost(hostname: string): boolean {
	return hostname === 'alibaba.com' || hostname.endsWith('.alibaba.com');
}

/** Origen de un enlace que debe abrirse en una pestaña aparte. */
export interface VerifiedLink {
	url: string;
	/** Host visible para el usuario (p. ej. `hebei-sinotools.en.alibaba.com`). */
	host: string;
	/** Si apunta a un `alibaba.com/trade/search`, es un enlace de demostración. */
	isSearch: boolean;
}

/**
 * Normaliza y valida un enlace a Alibaba. Acepta `https://…` y también `//…` (que se
 * completa con `https:`). Rechaza credenciales en la URL, puertos explícitos y hosts que
 * no sean `alibaba.com` o `*.alibaba.com`.
 */
export function verifyAlibabaLink(raw: string | null | undefined): VerifiedLink | null {
	if (!raw) return null;
	let value = raw.trim();
	if (value === '') return null;

	if (value.startsWith('//')) value = `https:${value}`;

	let parsed: URL;
	try {
		parsed = new URL(value);
	} catch {
		return null;
	}

	if (parsed.protocol !== 'https:') return null;
	if (!isAlibabaHost(parsed.hostname)) return null;
	if (parsed.port) return null;
	if (parsed.username || parsed.password) return null;

	return {
		url: parsed.toString(),
		host: parsed.hostname,
		isSearch: parsed.hostname === 'www.alibaba.com' && parsed.pathname === '/trade/search'
	};
}
