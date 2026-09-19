import { describe, it, expect, beforeAll } from 'vitest';
import { distExists, htmlRoutes, parseRoute, DIST } from '../helpers/dist';

// LEARN: a parser-inserted gtag.js competes with first paint, and a gtag defined inside define:vars'
// wrapper function never reaches window, so analytics.ts silently dropped every custom event.
let routes: string[] = [];

beforeAll(async () => {
  if (!distExists()) throw new Error(`No build found at ${DIST}. Run \`npm run build\` first.`);
  routes = await htmlRoutes();
});

describe('analytics', () => {
  it('never loads gtag.js from the HTML parser', () => {
    const parserLoaded = routes.filter((route) =>
      [...parseRoute(route).querySelectorAll('script[src]')].some((s) =>
        (s.getAttribute('src') ?? '').includes('googletagmanager.com'),
      ),
    );
    expect(parserLoaded).toEqual([]);
  });

  it('has exactly one inline snippet per page that defines a global gtag and defers gtag.js', () => {
    const wrong = routes
      .map((route) => {
        const snippets = [...parseRoute(route).querySelectorAll('script:not([src])')].filter((s) => {
          const code = s.textContent ?? '';
          return code.includes('window.gtag = function') && code.includes("addEventListener('load'");
        });
        return `${route}: ${snippets.length}`;
      })
      .filter((line) => !line.endsWith(': 1'));
    expect(wrong).toEqual([]);
  });
});
