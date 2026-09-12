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
