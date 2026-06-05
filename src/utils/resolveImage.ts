import type { ImageMetadata } from 'astro';

// LEARN: import.meta.glob with eager:true builds a path→module map at build time.
// Astro turns each imported raster into ImageMetadata (the { src, width, height,
// format } shape that <Image>/<Picture> need to generate srcset + AVIF/WebP).
// This lets content keep referencing images by their old public-style string path
// (e.g. "/works/fv3/fv33.webp") while we resolve it to the optimized asset that
// now lives in src/assets — no per-file ESM imports needed across ~27 MDX files.
const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/**/*.{png,jpg,jpeg,webp,avif,svg}',
  { eager: true },
);

/** True for absolute http(s) URLs (e.g. imgur) — these are not optimized locally. */
export const isRemote = (path?: string): boolean => !!path && /^https?:\/\//.test(path);

/**
 * Map a public-style path ("/works/fv3/fv33.webp") to its optimized ImageMetadata.
 * Returns undefined for remote URLs or paths with no matching asset, so callers
 * can fall back to a passthrough <img>.
 */
export function resolveImage(path?: string): ImageMetadata | undefined {
  if (!path || isRemote(path)) return undefined;
  return images[`/src/assets${path}`]?.default;
}
