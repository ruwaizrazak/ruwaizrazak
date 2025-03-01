import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const baseSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  heroImage: z.string().optional(),
  tags: z.array(z.string()).default([]),
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

const casestudies = defineCollection({
  loader: glob({
    base: './src/content/casestudies',
    pattern: '**/*.{md,mdx}',
  }),
  schema: baseSchema,
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

const live = defineCollection({
  loader: glob({
    base: './src/content/live',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z.object({
    Month: z.string(),
    OneLiner: z.string(),
    date: z.string(), // Changed to string to match the format in MD files
  }),
});

export const collections = {
  essays,
  notes,
  casestudies,
  books,
  live,
};
