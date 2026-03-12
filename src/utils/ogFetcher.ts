/**
 * Build-time Open Graph metadata scraper.
 *
 * Used by the tooltip system to fetch title and description for external
 * links at build time. Results are cached in-memory so each URL is fetched
 * at most once per build, even when the same link appears on multiple pages.
 */

export interface OgData {
  title: string | null;
  description: string | null;
}

/**
 * Module-level cache — persists for the lifetime of a single Astro build.
 * Deduplicates fetches when the same URL appears across multiple pages.
 */
const cache = new Map<string, OgData>();

export async function fetchOgData(url: string): Promise<OgData> {
  const cached = cache.get(url);
  if (cached) return cached;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; AstroBot/1.0; +https://astro.build)',
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();

    // Two regex patterns per meta tag because sites vary in attribute order:
    //   <meta property="og:title" content="...">   (property first)
    //   <meta content="..." property="og:title">   (content first)
    const ogTitle =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1] ??
      null;

    const ogDesc =
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)?.[1] ??
      null;

    // Fallback chain: og:title → <title>, og:description → <meta name="description">
    const title = ogTitle ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;
    const description =
      ogDesc ??
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1] ??
      null;

    const result: OgData = { title, description };
    cache.set(url, result);
    return result;
  } catch (_e) {
    // Swallow errors — a broken tooltip should never block the build.
    const fallback: OgData = { title: null, description: null };
    cache.set(url, fallback);
    return fallback;
  }
}
