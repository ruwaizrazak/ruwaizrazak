// LEARN: This file generates Open Graph images at build time using Satori.
// Satori (by Vercel) converts an element tree → SVG using a layout engine that
// supports flexbox. We then convert SVG → PNG with @resvg/resvg-js. This is the
// same pipeline that powers Vercel's @vercel/og package, but wired manually so
// we have full control over the design.
//
// LEARN: This used to be a .tsx file written in JSX, which meant the project had
// to carry react + react-dom + @astrojs/react purely to supply the JSX transform.
// Satori never needed React — JSX is only a syntax for building the plain object
// tree below, and Satori consumes that tree directly. Writing the tree by hand
// drops 5 dependencies and ~186KB of React that was being emitted into dist/.

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// LEARN: Satori needs raw font file buffers (ArrayBuffer), not CSS @font-face.
// We load .ttf files once at module level so they're cached across all image
// generations during a single build — avoids re-reading from disk for every page.
//
// We use process.cwd() (project root) instead of import.meta.url because Astro
// bundles this file into dist/ at build time — relative paths from import.meta.url
// would point into the build output directory where the fonts don't exist.
const root = process.cwd();
const fontsDir = join(root, 'src/assets/fonts');

const IBMPlexSerifBold = readFileSync(join(fontsDir, 'IBMPlexSerif-Bold.ttf'));
const SairaCondensedBold = readFileSync(join(fontsDir, 'SairaCondensed-Bold.ttf'));

// LEARN: Satori can't fetch images at build time (no HTTP server running),
// so we embed the avatar as a base64 data URI. This adds ~10-20KB to the SVG
// but gets rasterized into the final PNG with zero extra network requests.
const avatarPath = join(root, 'public/avatar.jpg');
const avatarBase64 = `data:image/jpeg;base64,${readFileSync(avatarPath).toString('base64')}`;

// LEARN: Human-readable labels for each collection type.
// The collection slug from Astro (e.g., 'seriesPosts') becomes a nice label
// on the OG card so readers know what kind of content they're about to open.
const COLLECTION_LABELS: Record<string, string> = {
  essays: 'Essay',
  notes: 'Note',
  works: 'Case Study',
  series: 'Series',
  seriesPosts: 'Series',
  playground: 'Playground',
};

interface OgImageProps {
  title: string;
  description: string;
  collection: string;
}

type Style = Record<string, string | number>;
type Child = OgNode | string | null | false | undefined;
interface OgNode {
  type: string;
  props: Record<string, unknown>;
}

/**
 * LEARN: The hand-rolled equivalent of JSX's createElement. Satori expects
 * `{ type, props: { children, style, ... } }` — exactly what JSX compiles to.
 * Falsy children are dropped so `cond && node` works like it did in JSX, and a
 * lone child is passed unwrapped because Satori treats a bare string as text.
 */
function h(type: string, props: Record<string, unknown> = {}, ...children: Child[]): OgNode {
  const kids = children.filter((c): c is OgNode | string => Boolean(c));
  return {
    type,
    props: {
      ...props,
      ...(kids.length === 0 ? {} : { children: kids.length === 1 ? kids[0] : kids }),
    },
  };
}

const el = (style: Style, ...children: Child[]) => h('div', { style }, ...children);

/**
 * Generate a 1200×630 PNG Open Graph image.
 *
 * LEARN: The OG image spec recommends 1200×630px for optimal display across
 * platforms (Facebook, Twitter/X, LinkedIn, iMessage, Discord, Slack).
 * Smaller images get cropped or letterboxed; larger ones waste bandwidth.
 */
export async function generateOgImage({ title, description, collection }: OgImageProps): Promise<Uint8Array> {
  const label = COLLECTION_LABELS[collection] ?? collection;

  // LEARN: Truncate long descriptions to prevent text overflow in the fixed
  // layout. 140 chars ≈ 2 lines at 22px on a 1200px-wide card.
  const truncatedDesc = description.length > 140
    ? description.slice(0, 137) + '...'
    : description;

  // LEARN: Satori supports only a subset of CSS: flexbox, basic box model,
  // fonts, colors. No CSS Grid, no position: absolute (use nested flexbox).
  const tree = el(
    { width: '100%', height: '100%', display: 'flex', backgroundColor: '#1a1a1a' },

    // LEARN: Left accent bar — a simple visual anchor that adds personality
    // to the card without requiring complex graphics. Uses the site's accent
    // color (#295757) to maintain brand consistency.
    el({ width: '8px', height: '100%', backgroundColor: '#295757' }),

    // Main content area
    el(
      {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px 60px 50px 52px',
        width: '100%',
        height: '100%',
      },

      // Top section: label + title + description
      el(
        { display: 'flex', flexDirection: 'column' },

        // Collection label
        el(
          {
            fontFamily: 'Saira Condensed',
            fontSize: '22px',
            fontWeight: 700,
            color: '#4a9090',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            marginBottom: '20px',
          },
          label,
        ),

        // LEARN: Satori handles text wrapping automatically via flexbox.
        // By setting a max-height and overflow: hidden, we ensure very long
        // titles don't break the layout — they simply get clipped.
        el(
          {
            fontFamily: 'IBM Plex Serif',
            fontSize: '52px',
            fontWeight: 700,
            color: '#e0e8e8',
            lineHeight: 1.2,
            maxHeight: '200px',
            overflow: 'hidden',
          },
          title,
        ),

        // Description
        truncatedDesc
          ? el(
              {
                fontFamily: 'IBM Plex Serif',
                fontSize: '22px',
                fontWeight: 700,
                color: 'rgba(224, 232, 232, 0.55)',
                lineHeight: 1.5,
                marginTop: '20px',
              },
              truncatedDesc,
            )
          : null,
      ),

      // Footer: avatar + site URL
      el(
        {
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          borderTop: '1px solid rgba(224, 232, 232, 0.15)',
          paddingTop: '24px',
        },

        // LEARN: The avatar uses borderRadius: '50%' for a circle crop.
        // Satori supports border-radius on images, which is convenient
        // since we can't use CSS clip-path.
        h('img', {
          src: avatarBase64,
          width: 44,
          height: 44,
          style: { borderRadius: '50%' },
        }),

        el(
          {
            fontFamily: 'Saira Condensed',
            fontSize: '20px',
            fontWeight: 700,
            color: 'rgba(224, 232, 232, 0.7)',
            letterSpacing: '0.5px',
          },
          'ruwaizrazak.com',
        ),
      ),
    ),
  );

  const svg = await satori(
    // LEARN: Satori's signature is typed against React.ReactNode, but it only
    // ever reads .type / .props at runtime. The cast keeps that contract
    // without pulling React's types back into the project.
    tree as unknown as Parameters<typeof satori>[0],
    {
      width: 1200,
      height: 630,
      // LEARN: Satori needs font definitions with the raw buffer data.
      // Each entry maps a font name (used in fontFamily above) to its
      // binary data and metadata. The name here must match the fontFamily
      // strings in the tree exactly.
      fonts: [
        { name: 'IBM Plex Serif', data: IBMPlexSerifBold, weight: 700, style: 'normal' },
        { name: 'Saira Condensed', data: SairaCondensedBold, weight: 700, style: 'normal' },
      ],
    },
  );

  // LEARN: Satori outputs an SVG string. Browsers can display SVGs, but
  // social platforms require raster images (PNG/JPEG). @resvg/resvg-js is
  // a Rust-based SVG renderer — fast and pixel-perfect. Same renderer Vercel uses.
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });
  const pngData = resvg.render();
  return pngData.asPng();
}
