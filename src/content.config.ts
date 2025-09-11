import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const baseSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce
    .date()
    .optional()
    .default(function (this: { pubDate: Date }) {
      return this.pubDate;
    }),
  heroImage: z.string().optional(),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().optional().default(false),
  publish: z.boolean().default(false),
  maturity: z
    .enum(['seed', 'plant', 'tree'])
    .optional()
    .default('seed'),
});

const essays = defineCollection({
  loader: glob({
    base: './src/content/essays',
    pattern: '**/*.{md,mdx}',
  }),
  schema: baseSchema,
});

const notes = defineCollection({
  loader: glob({
    base: './src/content/notes',
    pattern: '**/*.{md,mdx}',
  }),
  schema: baseSchema,
});

const works = defineCollection({
  loader: glob({
    base: './src/content/works',
    pattern: '**/*.{md,mdx}',
  }),
  schema: baseSchema.extend({
    company: z.string(),
    duration: z.string(),
    role: z.string().optional(),
    location: z.string().optional(),
  }),
});

const books = defineCollection({
  loader: glob({
    base: './src/content/books',
    pattern: '**/*.{md,mdx}',
  }),
  schema: baseSchema.extend({
    author: z.string(),
    rating: z.number().min(1).max(5).optional(),
    readStatus: z
      .enum(['reading', 'completed', 'to-read'])
      .default('to-read'),
  }),
});

// UPDATED: Series collection for nested structure using index files
// Structure: src/content/series/<series-slug>/index.(md|mdx)
const series = defineCollection({
  loader: glob({
    base: './src/content/series',
    pattern: '**/index.{md,mdx}',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    featuredImage: z.string(),
    startedDate: z.coerce.date(),
    lastUpdated: z.coerce.date(),
    publish: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    order: z.number().optional(),
  }),
});

// NEW: Series posts live alongside index files inside each series folder
// Structure: src/content/series/<series-slug>/<part-slug>.{md,mdx}
const seriesPosts = defineCollection({
  loader: glob({
    base: './src/content/series',
    pattern: ['**/*.{md,mdx}', '!**/index.{md,mdx}'],
  }),
  schema: baseSchema.extend({
    // Optional ordering and short description for listing pages
    seriesOrder: z.number().optional(),
    excerpt: z.string().optional(),
  }),
});

const live = defineCollection({
  loader: glob({
    base: './src/content/live',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z.object({
    Month: z.string(),
    OneLiner: z.string(),
    date: z.string(),
    publish: z.boolean().default(false),
  }),
});

export const collections = {
  essays,
  notes,
  works,
  books,
  live,
  series,
  seriesPosts, // Posts inside each series folder (filters will exclude index files in pages)
};