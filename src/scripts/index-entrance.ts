/**
 * Re-applies entrance animation classes after view-transition page swaps.
 * Called via `astro:page-load` from a regular <script> in index.astro.
 *
 * The initial IIFE that prevents FOUC lives in a `<script is:inline>` block
 * in index.astro because it must execute synchronously before first paint
 * (module scripts are deferred).
 */
export function ensureIndexEntrance(): void {
	if (window.location.pathname !== '/') return;

	const fromWork = sessionStorage.getItem('skipIndexAnimations') === '1';
	const el = document.body;
	const root = document.documentElement;

	if (fromWork) {
		el.classList.add('returned-from-work');
		root.classList.add('returned-from-work');
		sessionStorage.removeItem('skipIndexAnimations');
	} else if (
		!el.classList.contains('returned-from-work') &&
		!el.classList.contains('animate-in')
	) {
		el.classList.add('animate-in');
		root.classList.add('animate-in');
	}
}
