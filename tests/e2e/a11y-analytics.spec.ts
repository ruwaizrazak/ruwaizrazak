import { test, expect, type Locator } from '@playwright/test';
import { ROUTES } from './routes';

// WCAG 2.x AA for normal-size text; PSI audits the light theme.
const AA = 4.5;

// Composites the text colour over every translucent background up the tree, via a 1px canvas so
// color-mix()/oklab computed values resolve to sRGB.
async function contrast(locator: Locator): Promise<number> {
  return locator.evaluate((el) => {
    const cx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
    const rgba = (c: string) => {
      cx.clearRect(0, 0, 1, 1);
      cx.fillStyle = 'rgba(0,0,0,0)';
      cx.fillStyle = c;
      cx.fillRect(0, 0, 1, 1);
      const d = cx.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2], d[3] / 255];
    };
    const over = (f: number[], b: number[]) => [0, 1, 2].map((i) => f[i] * f[3] + b[i] * (1 - f[3])).concat(1);
    const layers: number[][] = [];
    for (let e: Element | null = el; e; e = e.parentElement) {
      const c = rgba(getComputedStyle(e).backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] === 1) break;
    }
    const bg = layers.reverse().reduce((b, c) => over(c, b), [255, 255, 255, 1]);
    const fg = over(rgba(getComputedStyle(el).color), bg);
    const lum = (c: number[]) =>
      [0, 1, 2]
        .map((i) => c[i] / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
    return (hi + 0.05) / (lo + 0.05);
  });
}

test.describe('accessibility and analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
  });

  test('flagged text meets AA contrast in light mode', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ROUTES.home);
    const targets = {
      'work-card date': page.locator('.work-card-content p').first(),
      'footer Index label': page.locator('footer span').filter({ hasText: /^\s*Index\s*$/ }),
      'footer index number': page.locator('footer span.font-mono').filter({ hasText: /^\s*01\s*$/ }),
      'Visit garden link': page.getByRole('link', { name: /visit garden/i }).first(),
      'Work with me button': page.locator('#about-menu-button'),
    };
    for (const [name, locator] of Object.entries(targets)) {
      expect(await contrast(locator), name).toBeGreaterThanOrEqual(AA);
    }
  });

  test('mobile menu button has a name that follows its state', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ROUTES.home);
    await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached();
    const button = page.locator('#mobile-menu-button');
    await expect(button).toHaveAccessibleName('Open menu');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toHaveAttribute('aria-controls', 'mobile-sidebar');
    await button.click();
    await expect(button).toHaveAccessibleName('Close menu');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  test('loads gtag.js after the load event and sends custom events', async ({ page }) => {
    // Keep the test offline: answer gtag.js with an empty script instead of fetching it.
    await page.route('https://www.googletagmanager.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }),
    );
    await page.goto(ROUTES.home);
    await expect
      .poll(() => page.evaluate(() => performance.getEntriesByType('resource').some((e) => e.name.includes('gtag/js'))))
      .toBe(true);
    const timing = await page.evaluate(() => ({
      requested: performance.getEntriesByType('resource').find((e) => e.name.includes('gtag/js'))!.startTime,
      loaded: (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).loadEventStart,
    }));
    expect(timing.requested).toBeGreaterThanOrEqual(timing.loaded);
    expect(await page.evaluate(() => typeof window.gtag)).toBe('function');

    // The footer island binds contact tracking on mount; retry the click until it is hydrated.
    const contact = page.locator('footer [data-contact]').first();
    await contact.scrollIntoViewIfNeeded();
    await expect
      .poll(async () => {
        await contact.evaluate((el) => {
          el.addEventListener('click', (e) => e.preventDefault(), { once: true });
          (el as HTMLElement).click();
        });
        return page.evaluate(() =>
          (window as unknown as { dataLayer: IArguments[] }).dataLayer.some(
            (entry) => entry[0] === 'event' && entry[1] === 'contact_click',
          ),
        );
      })
      .toBe(true);
  });
});
