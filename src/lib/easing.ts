/**
 * Cubic-bezier easing, so Svelte transitions can use the site's own curves.
 *
 * LEARN: this exists because JS-driven animation can't read a CSS custom
 * property. odometer.ts and related-notes.ts each hard-coded the literal
 * 'cubic-bezier(0.23, 1, 0.32, 1)' with a comment noting it mirrors
 * --ease-snappy in global.css and must be kept in sync by hand. One shared,
 * named function is easier to keep honest than two string literals.
 */

/** Solve the unit cubic bezier y for a given x, by Newton's method. */
function unitBezier(x1: number, y1: number, x2: number, y2: number) {
  const ax = 3 * x1 - 3 * x2 + 1;
  const bx = 3 * x2 - 6 * x1;
  const cx = 3 * x1;
  const ay = 3 * y1 - 3 * y2 + 1;
  const by = 3 * y2 - 6 * y1;
  const cy = 3 * y1;

  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDerivativeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  return (x: number): number => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const dx = sampleX(t) - x;
      if (Math.abs(dx) < 1e-5) break;
      const d = sampleDerivativeX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= dx / d;
    }
    return sampleY(t);
  };
}

/** `--ease-snappy` from global.css — the site's designated enter/exit curve. */
export const easeSnappy = unitBezier(0.23, 1, 0.32, 1);
