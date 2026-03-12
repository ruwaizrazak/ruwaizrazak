export interface OgData {
  title: string | null;
  description: string | null;
}

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

    const ogTitle =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1] ??
      null;

    const ogDesc =
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)?.[1] ??
      null;

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
    const fallback: OgData = { title: null, description: null };
    cache.set(url, fallback);
    return fallback;
  }
}
