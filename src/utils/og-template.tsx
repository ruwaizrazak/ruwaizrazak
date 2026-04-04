// LEARN: This file generates Open Graph images at build time using Satori.
// Satori (by Vercel) converts JSX → SVG using a layout engine that supports
// flexbox. We then convert SVG → PNG with @resvg/resvg-js. This is the same
// pipeline that powers Vercel's @vercel/og package, but wired manually so
// we have full control over the design.

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

  // LEARN: Satori uses JSX to describe the layout, but it's NOT React —
  // there's no DOM, no hooks, no state. It's purely a declarative description
  // of a flexbox layout that gets converted to SVG paths and text elements.
  // Only a subset of CSS is supported: flexbox, basic box model, fonts, colors.
  // No CSS Grid, no position: absolute (use nested flexbox instead).
  const svg = await satori(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: '#1a1a1a',
      }}
    >
      {/* LEARN: Left accent bar — a simple visual anchor that adds personality
          to the card without requiring complex graphics. Uses the site's accent
          color (#295757) to maintain brand consistency. */}
      <div
        style={{
          width: '8px',
          height: '100%',
          backgroundColor: '#295757',
        }}
      />

      {/* Main content area */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 60px 50px 52px',
          width: '100%',
          height: '100%',
        }}
      >
        {/* Top section: label + title + description */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Collection label */}
          <div
            style={{
              fontFamily: 'Saira Condensed',
              fontSize: '22px',
              fontWeight: 700,
              color: '#4a9090',
              textTransform: 'uppercase' as const,
              letterSpacing: '3px',
              marginBottom: '20px',
            }}
          >
            {label}
          </div>

          {/* LEARN: Satori handles text wrapping automatically via flexbox.
              By setting a max-height and overflow: hidden, we ensure very long
              titles don't break the layout — they simply get clipped. */}
          <div
            style={{
              fontFamily: 'IBM Plex Serif',
              fontSize: '52px',
              fontWeight: 700,
              color: '#e0e8e8',
              lineHeight: 1.2,
              maxHeight: '200px',
              overflow: 'hidden',
            }}
          >
            {title}
          </div>

          {/* Description */}
          {truncatedDesc && (
            <div
              style={{
                fontFamily: 'IBM Plex Serif',
                fontSize: '22px',
                fontWeight: 700,
                color: 'rgba(224, 232, 232, 0.55)',
                lineHeight: 1.5,
                marginTop: '20px',
              }}
            >
              {truncatedDesc}
            </div>
          )}
        </div>

        {/* Footer: avatar + site URL */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            borderTop: '1px solid rgba(224, 232, 232, 0.15)',
            paddingTop: '24px',
          }}
        >
          {/* LEARN: The avatar uses borderRadius: '50%' for a circle crop.
              Satori supports border-radius on images, which is convenient
              since we can't use CSS clip-path. */}
          <img
            src={avatarBase64}
            width={44}
            height={44}
            style={{ borderRadius: '50%' }}
          />
          <div
            style={{
              fontFamily: 'Saira Condensed',
              fontSize: '20px',
              fontWeight: 700,
              color: 'rgba(224, 232, 232, 0.7)',
              letterSpacing: '0.5px',
            }}
          >
            ruwaizrazak.com
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      // LEARN: Satori needs font definitions with the raw buffer data.
      // Each entry maps a font name (used in fontFamily above) to its
      // binary data and metadata. The name here must match the fontFamily
      // strings in the JSX exactly.
      fonts: [
        {
          name: 'IBM Plex Serif',
          data: IBMPlexSerifBold,
          weight: 700,
          style: 'normal',
        },
        {
          name: 'Saira Condensed',
          data: SairaCondensedBold,
          weight: 700,
          style: 'normal',
        },
      ],
    },
  );

  // LEARN: Satori outputs an SVG string. Browsers can display SVGs, but
  // social platforms require raster images (PNG/JPEG). @resvg/resvg-js is
  // a Rust-based SVG renderer compiled to WASM — it's fast and produces
  // pixel-perfect PNGs. This is the same renderer Vercel uses internally.
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });
  const pngData = resvg.render();
  return pngData.asPng();
}
