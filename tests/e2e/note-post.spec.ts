import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';
import { watchPage } from './helpers';

test.describe('note post layout', () => {
  test('hero renders collection eyebrow, maturity pill, meta, and tags', async ({ page, baseURL }) => {
    const { errors } = watchPage(page, baseURL!);

    await page.goto(ROUTES.pageWithWebmentions);

    const eyebrow = page.locator('.hero-eyebrow');
    await expect(eyebrow).toContainText('Notes');
    expect(await eyebrow.getAttribute('href')).toBe('/notes/');

    const maturity = page.locator('.hero-maturity-pill');
    await expect(maturity).toContainText(/seed|plant|tree/i);
    await expect
      .poll(async () => maturity.evaluate((el) => getComputedStyle(el).borderRadius))
      .not.toBe('0px');

    await expect(page.locator('.hero-meta-row')).toContainText(/\d+ min read/);
    await expect(page.locator('.hero-meta-row')).toContainText(/\w{3} \d{1,2}, \d{4}/);

    const firstTag = page.locator('.hero-tags a').first();
    const href = await firstTag.getAttribute('href');
    expect(href).toMatch(/^\/tags\/[a-z0-9% -]+$/);
    const response = await page.request.get(new URL(href!, baseURL).toString());
    expect(response.ok()).toBe(true);

    expect(errors).toEqual([]);
  });

  /**
   * The design puts the maturity pill in the eyebrow row, beside the collection
   * label — it once shipped at the head of the meta row instead. Asserting the
   * pill merely EXISTS passes either way, so both sides are pinned here.
   */
  test('maturity pill sits in the eyebrow row, not the meta row', async ({ page }) => {
    await page.goto(ROUTES.pageWithWebmentions);

    await expect(page.locator('.hero-eyebrow-row .hero-maturity-pill')).toHaveCount(1);
    await expect(page.locator('.hero-meta-row .hero-maturity-pill')).toHaveCount(0);
  });

  /**
   * The hero figure once shipped with NO styling at all: its rule was written in
   * NotePostHero's scoped <style> but applied to an <img> declared inside
   * ui/OptimizedPicture.svelte, so Svelte stripped it as an unused selector.
   * Geometry is asserted rather than a class name — a class can be present while
   * the CSS behind it was pruned, which is precisely how that bug hid.
   */
  test('hero image keeps its 16:7 geometry and rounded top', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ROUTES.pageWithHeroImage);

    const figure = page.locator('.hero-figure');
    await expect(figure).toBeVisible();

    const box = await figure.boundingBox();
    expect(box!.width / box!.height).toBeCloseTo(16 / 7, 1);

    await expect
      .poll(async () => figure.evaluate((el) => getComputedStyle(el).borderTopLeftRadius))
      .not.toBe('0px');
  });

  /** A post with no hero image must not leave an empty bordered box behind. */
  test('omits the hero figure when the post has no hero image', async ({ page }) => {
    await page.goto(ROUTES.pageWithWebmentions);
    await expect(page.locator('.hero-figure')).toHaveCount(0);
  });

  test('hero text clears the screen edge on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ROUTES.pageWithWebmentions);

    const box = await page.locator('h1.p-name').boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(20);
  });

  test('meta rule closes the row', async ({ page }) => {
    await page.goto(ROUTES.pageWithWebmentions);
    await expect(page.locator('.hero-meta-line')).toHaveCount(1);
  });

  test('capitalises tag labels while keeping hrefs lowercase', async ({ page }) => {
    await page.goto(ROUTES.pageWithWebmentions);

    const firstTag = page.locator('.hero-tags a').first();
    await expect(firstTag).toHaveText(/^[A-Z]/);
    expect(await firstTag.getAttribute('href')).toMatch(/^\/tags\/[^A-Z]+$/);
  });

  test('article measure is close to the design width at desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ROUTES.pageWithWebmentions);

    const box = await page.locator('article.e-content').boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(740);
    expect(box?.width ?? 0).toBeLessThanOrEqual(780);
  });

  test('keeps exactly one h1 on the page', async ({ page }) => {
    await page.goto(ROUTES.pageWithToc);
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('renders the maturity footer below the article body', async ({ page }) => {
    await page.goto(ROUTES.pageWithWebmentions);

    const footer = page.locator('.maturity-footer-line');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(/seed|plant|tree/i);
  });

  test('restyles callouts, side notes, and quotes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto(ROUTES.workWithVideo);
    const callout = page.locator('.callout').first();
    await expect(callout).toBeVisible();
    await expect
      .poll(async () => callout.evaluate((el) => getComputedStyle(el).borderLeftWidth))
      .toBe('0px');
    await expect
      .poll(async () => callout.evaluate((el) => getComputedStyle(el).borderRadius))
      .toBe('14px');

    await page.goto(ROUTES.pageWithToc);
    const sideNote = page.locator('.sidenote').first();
    await expect(sideNote).toBeVisible();
    await expect
      .poll(async () => sideNote.evaluate((el) => getComputedStyle(el).float))
      .toBe('none');

    // Unconditional: the essay carries a <Quote>, so an absent one is a failure.
    // It was previously guarded by `if (await quote.count())` and, with the only
    // Quote living in an unpublished entry, asserted against nothing.
    // `figure:has(blockquote)` rather than a bare `figure` — the essay's images
    // are figures too, and a bare locator picks the first image instead.
    const quoteFigure = page.locator('figure:has(blockquote)').first();
    await expect(quoteFigure).toBeVisible();

    const credit = quoteFigure.locator('figcaption');
    await expect(credit).toContainText('Saunders');

    const creditBox = await credit.boundingBox();
    const figureBox = await quoteFigure.boundingBox();
    expect(creditBox!.width).toBeGreaterThan(figureBox!.width * 0.9);
  });
});
