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
  type: 'content',
  schema: baseSchema,
});

const books = defineCollection({
  type: 'content',
  schema: baseSchema.extend({
    author: z.string(),
    rating: z.number().min(1).max(5).optional(),
  }),
});

export const collections = {
  essays,
  notes,
  casestudies,
  books,
};
