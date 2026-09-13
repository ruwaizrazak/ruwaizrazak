/**
 * Computed-style snapshot harness.
 *
 * LEARN: this is a TOOL, not a spec — it lives outside tests/e2e/ so Playwright
 * never picks it up as a test. It exists for one job: proving that a pure CSS
 * refactor (scoped <style> -> Tailwind utilities) changed nothing a browser
 * actually renders.
 *
 * Class names change wholesale during that refactor, so element identity is a
 * STRUCTURAL path (tag + nth-of-type) and never a class. DOM structure is what
 * must stay fixed; classes are what we are deliberately rewriting.
 *
 *   node tests/tools/style-snapshot.mjs <outDir> [baseURL]
 *   node tests/tools/style-snapshot.mjs --diff <dirA> <dirB>
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROUTES = [
  '/',
  '/garden/',
  '/series/',
  '/about/',
  '/essays/deconstructionofcodm/',
  '/notes/whythissite/',
  '/works/01Farmville3/',
  // LEARN: these two are not decoration. SeriesCard and SeriesPostCard render on
  // NEITHER /series/ nor /garden/ in the shape they take here — a first pass
  // "verified" a SeriesPostCard translation against routes that never render it,
  // which is a vacuous pass. Every component the refactor touches must appear on
  // at least one captured route.
  '/series/portfolio-to-garden/',           // SeriesCard header + SeriesPostCard grid
  '/series/prototyping-in-code/01-the-problem/', // series part -> RelatedNotes -> SeriesPostCard
];

const VIEWPORTS = [
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 900 },
];

const THEMES = ['light', 'dark'];

// The properties this refactor can plausibly move. Kept explicit so the
// snapshot stays small enough to diff by eye when it does fail.
const PROPS = [
  'display','position','flex-direction','flex-wrap','flex-grow','flex-shrink','flex-basis',
  'align-items','justify-content','gap','row-gap','column-gap','order',
  'grid-template-columns','grid-template-rows','grid-auto-rows','grid-auto-flow','grid-column','grid-row',
  'width','height','min-width','min-height','max-width','max-height','aspect-ratio',
  'padding-top','padding-right','padding-bottom','padding-left',
  'margin-top','margin-right','margin-bottom','margin-left',
  'font-family','font-size','font-weight','font-style','line-height','letter-spacing',
  'text-transform','text-align','text-overflow','white-space','overflow','overflow-x','overflow-y',
  'color','background-color','opacity',
  'border-top-width','border-right-width','border-bottom-width','border-left-width',
  'border-top-color','border-top-style','border-radius',
  'box-shadow','transform','transform-origin','transition-property','transition-duration',
  'transition-timing-function','z-index','cursor','object-fit','-webkit-line-clamp',
];

const MAX_ELEMENTS = 1500;

// LEARN: GSAP writes inline transforms every frame, so anything it drives is
// non-deterministic by construction and must be excluded by ancestor — a
// determinism run proved it (the walking character moved 0.1px between
// captures). CSS transitions are caught separately via getAnimations().
const EXCLUDE_SUBTREES = [
  '.garden-strip',
  '.grass-canvas',
  '.character',
  // The TOC pill's odometer label eases continuously and never settles, so its
  // opacity/transform differ between any two captures. It is Tier 3 — never
  // translated — so excluding it costs no coverage.
  '[data-toc-pill]',
];

async function capture(page, route, baseURL, theme) {
  await page.goto(new URL(route, baseURL).toString(), { waitUntil: 'networkidle' });
  await page.evaluate((t) => {
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, theme);
  // LEARN: WAIT for quiescence rather than guessing a timeout. Guessing made the
  // captured element SET non-deterministic (the old per-element `animating`
  // filter dropped different elements per run, which showed up as spurious +/-
  // entries), and half-loaded remote images reported height:0.
  await page.evaluate(async () => {
    const deadline = Date.now() + 2000;
    // 1. fonts — text metrics move until these resolve
    try { await document.fonts.ready; } catch {}
    // 2. images — a not-yet-decoded <img> measures 0 tall
    await Promise.all(
      [...document.images].map((img) =>
        img.complete
          ? null
          : new Promise((res) => {
              img.addEventListener('load', res, { once: true });
              img.addEventListener('error', res, { once: true });
              setTimeout(res, 5000);
            }),
      ),
    );
    // 3. animations — poll until nothing is running (entrance cascades,
    //    transitions). Budget is deliberately short: perpetual animators (the TOC
    //    pill's odometer) never settle, so a long deadline is pure wall-clock
    //    cost on every page. They are excluded from capture instead.
    while (Date.now() < deadline) {
      const running = document.getAnimations().filter((a) => a.playState === 'running');
      if (!running.length) break;
      await new Promise((r) => setTimeout(r, 100));
    }
  });
  await page.waitForTimeout(300);

  return page.evaluate(
    ({ props, max, exclude }) => {
      const path = (el) => {
        const parts = [];
        let n = el;
        while (n && n.nodeType === 1 && n !== document.documentElement) {
          const tag = n.tagName.toLowerCase();
          const sibs = n.parentElement
            ? [...n.parentElement.children].filter((c) => c.tagName === n.tagName)
            : [n];
          parts.unshift(sibs.length > 1 ? `${tag}:nth-of-type(${sibs.indexOf(n) + 1})` : tag);
          n = n.parentElement;
        }
        return parts.join('>');
      };

      const out = {};

      // LEARN: two notations the browser reports differently for pixel-IDENTICAL
      // results, both introduced by translating scoped CSS to utilities. Verified
      // by rendering both to a canvas and comparing pixels before normalising:
      //   1. Tailwind's `bg-token/N` mixes in oklab; the hand-written CSS used
      //      `color-mix(in srgb, …)`. Mixing with `transparent` only changes
      //      alpha, so both render the same rgba. Resolve every colour through a
      //      canvas so the snapshot is colour-space agnostic.
      //   2. `rounded-full` is `calc(infinity * 1px)` -> 33554432px, where the CSS
      //      said `999px`. Both are maximally round for any real element.
      const cvs = document.createElement('canvas');
      cvs.width = cvs.height = 1;
      const ctx = cvs.getContext('2d', { willReadFrequently: true });
      const colorCache = new Map();
      const canonColor = (v) => {
        if (!v || !/^(rgb|rgba|color\(|oklab|oklch|lab|lch|hsl)/.test(v)) return v;
        if (colorCache.has(v)) return colorCache.get(v);
        let out = v;
        try {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = v;
          ctx.fillRect(0, 0, 1, 1);
          const d = ctx.getImageData(0, 0, 1, 1).data;
          out = `rgba(${d[0]},${d[1]},${d[2]},${d[3]})`;
        } catch {}
        colorCache.set(v, out);
        return out;
      };
      // `0.15s, 0.15s` and `0.15s` are the same thing when transition-property
      // lists two entries — CSS repeats a single value across the list. Collapse
      // runs of identical comma-separated values so that notation does not read
      // as a change.
      const canonList = (v) => {
        const parts = v.split(',').map((x) => x.trim());
        return parts.length > 1 && parts.every((x) => x === parts[0]) ? parts[0] : v;
      };
      const canonRadius = (v) =>
        v.replace(/([\d.]+(?:e\+?\d+)?)px/g, (m, n) => (parseFloat(n) >= 999 ? 'pill' : m));

      const all = [...document.body.querySelectorAll('*')]
        .filter((el) => !['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName))
        .filter((el) => !exclude.some((sel) => el.closest(sel)))
        .slice(0, max);

      for (const el of all) {
        const cs = getComputedStyle(el);
        out[path(el)] = props
          .map((p) => {
            const v = cs.getPropertyValue(p);
            if (p.includes('color')) return canonColor(v);
            if (p === 'border-radius') return canonRadius(v);
            if (p === 'transition-duration' || p === 'transition-timing-function') return canonList(v);
            return v;
          })
          .join('|');
      }
      return out;
    },
    { props: PROPS, max: MAX_ELEMENTS, exclude: EXCLUDE_SUBTREES },
  );
}

async function run(outDir, baseURL) {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  let pages = 0;

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    for (const theme of THEMES) {
      for (const route of ROUTES) {
        const data = await capture(page, route, baseURL, theme);
        const key = `${route.replace(/\//g, '_') || '_root'}__${vp.name}__${theme}.json`;
        writeFileSync(join(outDir, key), JSON.stringify(data, null, 0));
        pages++;
        process.stdout.write(`\r  captured ${pages}/${ROUTES.length * VIEWPORTS.length * THEMES.length}`);
      }
    }
    await ctx.close();
  }
  await browser.close();
  console.log(`\n  -> ${outDir}`);
}

function diff(a, b) {
  const files = new Set([...readdirSync(a), ...readdirSync(b)]);
  let changed = 0;
  let compared = 0;
  for (const f of [...files].sort()) {
    const pa = join(a, f);
    const pb = join(b, f);
    if (!existsSync(pa) || !existsSync(pb)) {
      console.log(`  MISSING  ${f}`);
      changed++;
      continue;
    }
    const A = JSON.parse(readFileSync(pa, 'utf8'));
    const B = JSON.parse(readFileSync(pb, 'utf8'));
    const keys = new Set([...Object.keys(A), ...Object.keys(B)]);
    const deltas = [];
    for (const k of keys) {
      compared++;
      if (A[k] !== B[k]) {
        if (A[k] === undefined) deltas.push(`    + ${k}`);
        else if (B[k] === undefined) deltas.push(`    - ${k}`);
        else {
          const av = A[k].split('|');
          const bv = B[k].split('|');
          const props = PROPS.filter((_, i) => av[i] !== bv[i])
            .map((p, i) => p)
            .slice(0, 6);
          const detail = PROPS.map((p, i) => (av[i] !== bv[i] ? `${p}: ${av[i]} -> ${bv[i]}` : null))
            .filter(Boolean)
            .slice(0, 6);
          deltas.push(`    ~ ${k}\n        ${detail.join('\n        ')}`);
        }
      }
    }
    if (deltas.length) {
      changed += deltas.length;
      console.log(`\n  ${f}  (${deltas.length} changed)`);
      console.log(deltas.slice(0, 12).join('\n'));
      if (deltas.length > 12) console.log(`    … ${deltas.length - 12} more`);
    }
  }
  console.log(`\n  compared ${compared} elements`);
  console.log(changed === 0 ? '  PASS — no computed-style differences' : `  FAIL — ${changed} differences`);
  process.exit(changed === 0 ? 0 : 1);
}

const argv = process.argv.slice(2);
if (argv[0] === '--diff') diff(argv[1], argv[2]);
else await run(argv[0] ?? '.style-snap/base', argv[1] ?? 'http://localhost:4321');
