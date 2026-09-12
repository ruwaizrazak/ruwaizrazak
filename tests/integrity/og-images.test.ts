import { describe, it, expect, beforeAll } from 'vitest';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { distExists, htmlRoutes, parseRoute, DIST } from '../helpers/dist';
import { isSeoExempt, isUtilityRoute } from '../helpers/seo-policy';

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function pngFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, name.name);
    if (name.isDirectory()) out.push(...pngFiles(full));
    else if (name.name.endsWith('.png')) out.push(full);
  }
  return out;
}

let routes: string[] = [];

beforeAll(async () => {
  if (!distExists()) throw new Error(`No build found at ${DIST}. Run \`npm run build\` first.`);
  routes = await htmlRoutes();
});

describe('OG image endpoints', () => {
  it('generates images', () => {
    expect(pngFiles(join(DIST, 'og')).length).toBeGreaterThan(0);
  });

  it('emits real PNG bytes, not an error page', () => {
    // Satori + resvg can fail silently and write a zero-byte or HTML response;
    // checking the magic number is the only way to know the file is an image.
    for (const file of pngFiles(join(DIST, 'og'))) {
      const head = readFileSync(file).subarray(0, 8);
      expect(head.equals(PNG_MAGIC), `${file} is not a PNG`).toBe(true);
    }
  });

  it('never emits a suspiciously tiny image', () => {
    for (const file of pngFiles(join(DIST, 'og'))) {
      expect(statSync(file).size, `${file} is too small to be a real card`).toBeGreaterThan(2000);
    }
  });

  it('backs every page’s og:image with a file that exists', () => {
    const missing: string[] = [];
    for (const route of routes.filter((r) => !isSeoExempt(r) && !isUtilityRoute(r))) {
      const src = parseRoute(route)
        .querySelector('meta[property="og:image"]')
        ?.getAttribute('content');
      if (!src) continue;

      const path = src.replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '');
      // Remote OG images (imgur heroes) are not ours to verify.
      if (/^https?:\/\//.test(path)) continue;
      if (!existsSync(join(DIST, path))) missing.push(`${route} -> ${src}`);
    }
    expect(missing).toEqual([]);
  });
});
