import { getImage } from 'astro:assets';
import { resolveImage } from './resolveImage';

/**
 * A plain, serialisable description of an optimized image.
 *
 * LEARN: this exists so Svelte components can render optimized images. Astro's
 * <Image /> is an .astro component and getImage() is async — neither is reachable
 * from a Svelte component, which cannot await during render. So the .astro side
 * resolves the image and hands the Svelte view this flat object instead.
 */
export interface OptimizedImg {
  src: string;
  width?: number;
  height?: number;
  /** True when the source was remote/unknown and is served through as-is. */
  passthrough: boolean;
}

/**
 * Resolve a public-style image path to optimized attributes.
 *
 * LEARN: must be awaited from .astro frontmatter — it imports astro:assets.
 * Mirrors what <Image src={resolveImage(path)} /> emitted before: getImage()
 * runs the same pipeline, so the emitted asset (and its WebP conversion) is
 * identical. Remote URLs and unmatched paths fall back to a passthrough <img>,
 * exactly as the old `heroImg ? <Image> : <img>` branch did.
 */
export async function optimizeImage(path?: string): Promise<OptimizedImg | null> {
  if (!path) return null;
  const meta = resolveImage(path);
  if (!meta) return { src: path, passthrough: true };
  const img = await getImage({ src: meta });
  return {
    src: img.src,
    width: meta.width,
    height: meta.height,
    passthrough: false,
  };
}

/** A resolved <picture>: modern-format sources plus the fallback <img>. */
export interface OptimizedPicture {
  sources: { srcset: string; type: string }[];
  img: OptimizedImg;
}

/**
 * Resolve a path to AVIF/WebP <source>s plus a fallback <img>.
 *
 * LEARN: the Astro equivalent is <Picture formats={['avif','webp']} />, used for
 * the above-the-fold post hero where AVIF's compression matters most. Astro 5
 * exposes no public getPicture(), so this calls getImage() once per format and
 * once for the fallback — which is exactly what <Picture> does internally, so
 * the emitted assets and hashes match.
 *
 * Returns a passthrough OptimizedImg (sources: []) for remote/unmatched paths.
 */
export async function optimizePicture(
  path?: string,
  formats: ('avif' | 'webp')[] = ['avif', 'webp'],
  fallbackFormat: 'avif' | 'webp' = 'webp',
): Promise<OptimizedPicture | null> {
  if (!path) return null;
  const meta = resolveImage(path);
  if (!meta) return { sources: [], img: { src: path, passthrough: true } };

  const sources = await Promise.all(
    formats.map(async (format) => {
      const out = await getImage({ src: meta, format });
      return { srcset: out.src, type: `image/${format}` };
    }),
  );
  const fallback = await getImage({ src: meta, format: fallbackFormat });
  return {
    sources,
    img: { src: fallback.src, width: meta.width, height: meta.height, passthrough: false },
  };
}
