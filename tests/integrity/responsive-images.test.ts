import { describe, it, expect, beforeAll } from 'vitest';
import { distExists, parseRoute, assetExists, DIST } from '../helpers/dist';

// LEARN: a work card without a width srcset makes a phone download the 1200–1600w original for a
// ~376px slot. Each card must ship AVIF + WebP candidates that exist in the build.
const CARD_PAGES: Record<string, number> = {
  '/': 3,
  '/works/': 3,
  '/about/': 3,
  '/works/01Farmville3/': 2,
};

const candidates = (srcset: string) => srcset.split(',').map((part) => part.trim().split(/\s+/));

beforeAll(() => {
  if (!distExists()) throw new Error(`No build found at ${DIST}. Run \`npm run build\` first.`);
});

describe('work card images', () => {
  for (const [route, count] of Object.entries(CARD_PAGES)) {
    it(`${route} serves ${count} responsive AVIF/WebP card pictures`, () => {
      const pictures = [...parseRoute(route).querySelectorAll('picture.contents')];
      expect(pictures).toHaveLength(count);
      for (const picture of pictures) {
        const sources = [...picture.querySelectorAll('source')];
        expect(sources.map((s) => s.getAttribute('type'))).toEqual(['image/avif', 'image/webp']);
        for (const source of sources) {
          expect(source.getAttribute('sizes')).toMatch(/calc\(/);
          const list = candidates(source.getAttribute('srcset') ?? '');
          expect(list.length).toBeGreaterThanOrEqual(5);
          for (const [url, descriptor] of list) {
            expect(descriptor).toMatch(/^\d+w$/);
            expect(assetExists(url)).toBe(true);
          }
        }
        expect(picture.querySelector('img')?.getAttribute('loading')).toBe('lazy');
      }
    });
  }

  it('leaves the post hero picture as it was: no wrapper class, no sizes, no width srcset', () => {
    const hero = parseRoute('/essays/deconstructionofcodm/').querySelector('.hero-figure picture');
    expect(hero).not.toBeNull();
    expect(hero!.hasAttribute('class')).toBe(false);
    for (const source of hero!.querySelectorAll('source')) {
      expect(source.hasAttribute('sizes')).toBe(false);
      expect(source.getAttribute('srcset')).not.toMatch(/\s\d+w/);
    }
  });
});
