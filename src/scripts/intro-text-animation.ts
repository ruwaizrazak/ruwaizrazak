/**
 * GSAP text-intro style animation for the intro line: split by character,
 * stagger reveal (opacity + y). Matches the pattern from gsap.com/text/ "text-intro".
 * Only runs on index when body has animate-in (not when returned-from-work).
 */
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

const TEXT_INTRO_SELECTOR = '.text-intro';

function runIntroTextAnimation(): void {
	if (typeof document === 'undefined' || typeof window === 'undefined') return;
	if (window.location.pathname !== '/') return;

	const body = document.body;
	if (body.classList.contains('returned-from-work')) return;
	if (!body.classList.contains('animate-in')) return;

	const el = document.querySelector<HTMLElement>(TEXT_INTRO_SELECTOR);
	if (!el) return;

	const split = SplitText.create(el, {
		type: 'chars',
		charsClass: 'char++',
	});

	gsap.set(split.chars, { opacity: 0, y: 20 });

	gsap.to(split.chars, {
		opacity: 1,
		y: 0,
		duration: 0.5,
		stagger: 0.03,
		ease: 'power2.out',
		delay: 0.3, // align with first line’s HeroSectionIntro delay
	});
}

/**
 * Called on index page load. Runs the animation if conditions are met.
 * Also used after view-transition to re-run when navigating back to index.
 */
export function initIntroTextAnimation(): void {
	// Allow DOM and body classes to be ready
	requestAnimationFrame(() => {
		requestAnimationFrame(runIntroTextAnimation);
	});
}
