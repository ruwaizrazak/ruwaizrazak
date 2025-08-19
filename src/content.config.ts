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

// UPDATED: Series collection for series metadata only
const series = defineCollection({
  loader: glob({
    base: './src/content/series',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    featuredImage: z.string(), // Using your heroImage equivalent
    startedDate: z.coerce.date(), // When the series began
    lastUpdated: z.coerce.date(), // When last post was added/updated
    publish: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    order: z.number().optional(), // For manual ordering on series index page
  }),
});

// NEW: Series posts collection for individual posts within series
const seriesPosts = defineCollection({
  loader: glob({
    base: './src/content/series-posts',
    pattern: '**/*.{md,mdx}',
  }),
  schema: baseSchema.extend({
    seriesSlug: z.string(), // References the series folder/slug
    seriesOrder: z.number(), // Order within the series
    excerpt: z.string().optional(), // Short description for series page
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
  seriesPosts, // New collection for series posts
};