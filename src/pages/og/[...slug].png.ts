// LEARN: This is an Astro static endpoint — it generates files at build time,
// not on-demand. The `.png.ts` extension tells Astro to produce `.png` files.
// Combined with getStaticPaths(), it generates one PNG per content page,
// just like [...slug].astro generates one HTML page per content entry.

import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { generateOgImage } from '../../utils/og-template';

// LEARN: getStaticPaths() tells Astro which routes to pre-render at build time.
// For a file named `[...slug].png.ts`, each entry produces a file at
// /og/{slug}.png in the build output. The `props` object is passed to the
// GET handler for that specific route.
export const getStaticPaths: GetStaticPaths = async () => {
  // LEARN: We fetch all collections in parallel with Promise.all for speed.
  // Each getCollection() call reads from disk, so parallelising saves time
  // compared to sequential awaits (especially with many collections).
  const [essays, notes, works, playground, seriesIndexes, seriesParts] = await Promise.all([
    getCollection('essays', ({ data }) => data.publish),
    getCollection('notes', ({ data }) => data.publish),
    getCollection('works', ({ data }) => data.publish),
    getCollection('playground', ({ data }) => data.publish),
    getCollection('series', ({ data }) => data.publish),
    getCollection('seriesPosts', ({ data }) => data.publish),
  ]);

  // LEARN: The slug in the OG endpoint must match the slug used in the actual
  // page route, otherwise the <meta og:image> URL will 404.
  //
  // For essays/notes/playground: getStaticPathsForCollection() extracts the
  // last segment of post.id and lowercases it. We replicate that logic here.
  //
  // For works: the content config's generateId already normalises the ID
  // (strips extension, replaces spaces with dashes), so we use post.id directly.
  //
  // For series: index pages drop "/index" from the ID; parts keep the full ID.

  const extractSlug = (id: string) => {
    const parts = id.split('/');
    const last = parts[parts.length - 1] ?? id;
    return last.replace(/\.[^.]+$/, '').toLowerCase();
  };

  const paths = [
    ...essays.map((p) => ({
      params: { slug: `essays/${extractSlug(p.id)}` },
      props: { title: p.data.title, description: p.data.description, collection: 'essays' },
    })),
    ...notes.map((p) => ({
      params: { slug: `notes/${extractSlug(p.id)}` },
      props: { title: p.data.title, description: p.data.description, collection: 'notes' },
    })),
    ...works.map((p) => ({
      params: { slug: `works/${p.id}` },
      props: { title: p.data.title, description: p.data.description, collection: 'works' },
    })),
    ...playground.map((p) => ({
      params: { slug: `playground/${extractSlug(p.id)}` },
      props: { title: p.data.title, description: p.data.description, collection: 'playground' },
    })),
    ...seriesIndexes.map((p) => ({
      params: { slug: `series/${p.id.replace(/\/index$/, '')}` },
      props: { title: p.data.title, description: p.data.description, collection: 'series' },
    })),
    ...seriesParts
      .filter((p) => !p.id.endsWith('/index'))
      .map((p) => ({
        params: { slug: `series/${p.id}` },
        props: { title: p.data.title, description: p.data.description, collection: 'seriesPosts' },
      })),
  ];

  return paths;
};

// LEARN: The GET handler runs once per path at build time. Astro calls it with
// the `props` from getStaticPaths and writes the Response body to a .png file.
// The Content-Type header isn't strictly needed for static files (the file
// extension handles it), but it's good practice for correctness.
export const GET: APIRoute = async ({ props }) => {
  const { title, description, collection } = props as {
    title: string;
    description: string;
    collection: string;
  };

  const png = await generateOgImage({ title, description, collection });

  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  });
};
