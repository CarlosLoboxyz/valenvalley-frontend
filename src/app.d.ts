import type { Locale } from '$lib/i18n';
import type { Theme } from '$lib/preferences/constants';

// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			theme: Theme;
			locale: Locale;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
