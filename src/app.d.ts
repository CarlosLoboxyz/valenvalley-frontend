import type { Locale } from '$lib/i18n';
import type { Theme } from '$lib/preferences/constants';

// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			theme: Theme;
			locale: Locale;
			/** Usuario autenticado en PocketBase (null si no hay sesión). */
			user: import('$lib/services/pocketbase').PocketBaseUser | null;
			/** Token de PocketBase de la sesión; se reenvía al backend como Bearer. Nunca llega al navegador. */
			pbToken: string | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
