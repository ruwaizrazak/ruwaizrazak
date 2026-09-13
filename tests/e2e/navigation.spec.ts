import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';

test.describe('desktop navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ROUTES.home);
    // The nav is an island, so its listeners attach after DOMContentLoaded.
    // hover() dispatches ONCE and never retries — hovering before hydration
    // would silently do nothing and every assertion below would be a lie.
    await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached();
  });

  test('opens the garden shelf on hover and flips its chevron', async ({ page }) => {
    const trigger = page.locator('#desktop-menu-button');
    await trigger.hover();

    await expect(page.locator('#desktop-dropdown')).toBeVisible();
    await expect(page.locator('#desktop-chevron')).toHaveClass(/rotate-180/);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  test('stays open while the pointer crosses the gap into the shelf', async ({ page }) => {
    const dropdown = page.locator('#desktop-dropdown');
    await page.locator('#desktop-menu-button').hover();
    await expect(dropdown).toBeVisible();

    // The shelf floats 10px clear of the bar. Dropdown.scheduleClose() exists so
    // that crossing that gap doesn't close the menu out from under the pointer —
    // nothing covered this before, and it's the whole reason hover is usable.
    await dropdown.locator('a').first().hover();
    await page.waitForTimeout(400); // past the grace window AND the hidden lag

    await expect(dropdown).toBeVisible();
    await expect(dropdown).not.toHaveClass(/hidden/);
  });

  test('closes once the pointer leaves both the trigger and the shelf', async ({ page }) => {
    await page.locator('#desktop-menu-button').hover();
    await expect(page.locator('#desktop-dropdown')).toBeVisible();

    await page.mouse.move(5, 600);
    // The panel fades first and only then gets `hidden`, so assert the end state.
    await expect(page.locator('#desktop-dropdown')).toHaveClass(/hidden/);
  });

  test('hovering the contact trigger closes the garden shelf', async ({ page }) => {
    await page.locator('#desktop-menu-button').hover();
    await page.locator('#about-menu-button').hover();

    await expect(page.locator('#about-dropdown')).toBeVisible();
    await expect(page.locator('#desktop-dropdown')).toHaveClass(/hidden/);
  });

  test('opens on focus, and the shelf comes before the rest of the bar', async ({ page }) => {
    const dropdown = page.locator('#desktop-dropdown');
    await page.locator('#desktop-menu-button').focus();
    await expect(dropdown).toBeVisible();

    // Regression guard, asserted structurally so it holds in every engine: the
    // panel used to render at the END of <nav>, so the Tab after the trigger
    // landed on "About" — outside the panel — and leaveGarden() closed the shelf
    // before any link inside it could be reached. DOCUMENT_POSITION_FOLLOWING (4)
    // means #about-menu-button now comes after the panel.
    const aboutFollowsShelf = await page.evaluate(() => {
      const shelf = document.querySelector('#desktop-dropdown');
      const about = document.querySelector('#about-menu-button');
      if (!shelf || !about) return false;
      return Boolean(shelf.compareDocumentPosition(about) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(aboutFollowsShelf).toBe(true);
  });

  // WebKit keeps links out of the Tab order unless the reader turns on Safari's
  // "Press Tab to highlight each item on a webpage", so the literal key press only
  // means something on the engines that tab to links. The structural guard above
  // covers WebKit.
  test('tabs from the trigger straight into the first shelf link', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Safari excludes links from sequential focus by default');

    const dropdown = page.locator('#desktop-dropdown');
    await page.locator('#desktop-menu-button').focus();
    await expect(dropdown).toBeVisible();

    await page.keyboard.press('Tab');

    await expect(dropdown.locator('a').first()).toBeFocused();
    await expect(dropdown).toBeVisible();
  });

  test('the shelf is clipped at the bar edge and starts fully behind it', async ({ page }) => {
    // This is the entrance the design asks for: the shelf slides out from UNDER the
    // pill. It can't be done with z-order — the shelf lives inside the bar for tab
    // order, and a descendant always paints over its ancestor's background — so the
    // illusion rests entirely on the clip wrapper. Assert the two things that make
    // it work, rather than trying to catch a frame mid-transition.
    const geometry = await page.evaluate(() => {
      const panel = document.querySelector('#desktop-dropdown');
      if (!panel) return null;
      const clip = panel.parentElement;
      const bar = clip?.offsetParent; // the pill itself — it carries `relative`
      if (!clip || !bar) return null;
      const p = panel.getBoundingClientRect();
      const c = clip.getBoundingClientRect();
      const b = bar.getBoundingClientRect();
      return {
        overflow: getComputedStyle(clip).overflow,
        clipTopOffsetFromBarBottom: Math.abs(c.top - b.bottom),
        closedPanelSitsAboveTheClip: p.bottom <= c.top + 1,
      };
    });

    expect(geometry).not.toBeNull();
    expect(geometry!.overflow).toBe('hidden');
    // Clipped exactly at the bar's OUTER edge. `mt-px` on the wrapper pays for the
    // bar's 1px border: top-full resolves against the padding box, so without it the
    // shelf shows a hairline over the bar's own border as it slides.
    expect(geometry!.clipTopOffsetFromBarBottom).toBeLessThan(1);
    // Closed, the whole panel is above the clip line — tucked behind the pill, not
    // peeking out of it, so the first thing you see is it emerging from the bar.
    expect(geometry!.closedPanelSitsAboveTheClip).toBe(true);
  });

  test('its links navigate', async ({ page }) => {
    await page.locator('#desktop-menu-button').hover();
    const link = page.locator('#desktop-dropdown a').first();
    const href = await link.getAttribute('href');

    await link.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });
});

test.describe('mobile navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTES.home);
  });

  test('slides the sidebar in and locks the page behind it', async ({ page }) => {
    await page.locator('#mobile-menu-button').click();

    await expect(page.locator('#mobile-sidebar')).not.toHaveClass(/translate-x-full/);
    await expect(page.locator('#mobile-overlay')).toBeVisible();
    await expect
      .poll(async () => page.evaluate(() => document.body.style.overflow))
      .toBe('hidden');
  });

  test('closes from the overlay and restores scrolling', async ({ page }) => {
    await page.locator('#mobile-menu-button').click();
    await page.locator('#mobile-overlay').click({ position: { x: 10, y: 10 } });

    await expect(page.locator('#mobile-sidebar')).toHaveClass(/translate-x-full/);
    await expect.poll(async () => page.evaluate(() => document.body.style.overflow)).toBe('');
  });

  test('closes when a link inside it is followed', async ({ page }) => {
    await page.locator('#mobile-menu-button').click();
    await page.locator('#mobile-sidebar a').first().click();

    await expect(page.locator('#mobile-sidebar')).toHaveClass(/translate-x-full/);
  });

  test('closes itself when the viewport grows to desktop', async ({ page }) => {
    await page.locator('#mobile-menu-button').click();
    await page.setViewportSize({ width: 1280, height: 900 });

    await expect(page.locator('#mobile-sidebar')).toHaveClass(/translate-x-full/);
  });
});
