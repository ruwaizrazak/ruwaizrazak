# Codebase Optimization Notes

A breakdown of the optimization techniques applied during the refactor — what each problem was, the principle behind the fix, and before/after code from the actual codebase.

---

## 1. Shared Type Definitions

**The smell:** The `Maturity` type (`'seed' | 'plant' | 'tree'`) was defined inline in 6+ files — component props, utility functions, icon mappings. Any change (e.g. adding a new maturity level) required editing every file.

**The principle:** **Single Source of Truth.** Define a type once, import it everywhere. When the type changes, you change one file.

### Before

```typescript
// src/components/NoteCard.astro
type Maturity = 'seed' | 'plant' | 'tree';

// src/components/EssayCard.astro
type Maturity = 'seed' | 'plant' | 'tree';

// src/utils/maturityIcons.ts
type Maturity = 'seed' | 'plant' | 'tree';
```

### After

```typescript
// src/types.ts
export type Maturity = 'seed' | 'plant' | 'tree';

export type CollectionName = 'notes' | 'essays' | 'casestudies' | 'books'
  | 'playground' | 'works' | 'live' | 'series' | 'seriesPosts';

export interface ContentCardProps {
  title: string;
  description?: string;
  pubDate: Date;
  heroImage?: string;
  url: string;
  imageHeight?: string;
  maturity?: Maturity;
  collection?: string;
  variant?: 'card' | 'compact';
}

export interface SocialLinkData {
  href: string;
  label: string;
  rel?: string;
  class?: string;
  diamondPath: string;
  symbolPath: string;
  symbolFill?: 'stroke' | 'fill';
  symbolStrokeAttrs?: string;
}
```

Then everywhere else:

```typescript
import type { Maturity } from '../types';
```

**Applied in:** `src/types.ts`, `src/utils/maturityIcons.ts`, `src/components/MaturityBadge.astro`, `src/components/ContentCard.astro`, `src/utils/collections.ts`

---

## 2. Centralizing Constants

**The smell:** The Google Analytics ID appeared as a raw string in multiple places. Collection name arrays (`['notes', 'essays', 'books', ...]`) were duplicated across page files. Social link data was hardcoded directly in Footer markup.

**The principle:** **Don't Repeat Yourself (constants edition).** Magic strings and configuration values belong in one place so they can be updated without a find-and-replace hunt.

### Before

```astro
<!-- src/pages/garden/index.astro -->
const collections = ['all', 'notes', 'essays', 'books', 'playground'];

<!-- src/pages/notes/index.astro -->
const collections = ['all', 'notes', 'essays', 'casestudies', 'books'];
```

### After

```typescript
// src/consts.ts
export const GA_ID = 'G-75GYY3Y3H3';

export const DEFAULT_COLLECTIONS = ['all', 'notes', 'essays', 'casestudies', 'books'];
export const GARDEN_COLLECTIONS = ['all', 'notes', 'essays', 'books', 'playground'];

export const SOCIAL_LINKS = [
  {
    href: 'mailto:ruwaizrazak@gmail.com',
    label: 'Email',
    rel: 'noopener noreferrer',
    // ... SVG path data
  },
  // ... other links
];
```

Then in pages:

```astro
---
import { GARDEN_COLLECTIONS } from '../../consts';
---
<IndexLayout collections={GARDEN_COLLECTIONS} ... />
```

**Applied in:** `src/consts.ts`, `src/pages/garden/index.astro`, `src/pages/notes/index.astro`, `src/pages/series/index.astro`, `src/components/Footer.astro`, `src/components/BaseHead.astro`

---

## 3. Utility Functions for Repeated Logic

**The smell:** Every index page had the same ~8-line block: fetch collection → filter by `publish === true` → sort by `pubDate` descending. Date formatting (`toLocaleDateString(...)`) was written out in every card component. Every `[...slug].astro` file had the same `getStaticPaths` boilerplate.

**The principle:** **Extract repeated logic into functions.** When 5 files all do the same transformation, that's a function waiting to be born.

### Before

```astro
<!-- Repeated in every index page -->
---
const allNotes = await getCollection('notes', ({ data }) => data.publish === true);
const sortedNotes = allNotes
  .map(post => ({ ...post, collection: 'notes' }))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

const allTags = ['all', ...new Set(sortedNotes.flatMap(post => post.data.tags || []))].sort();
---

<!-- Repeated in every card component -->
<time>{new Date(pubDate).toLocaleDateString('en-US', {
  year: 'numeric', month: 'long', day: 'numeric'
})}</time>

<!-- Repeated in every [...slug].astro -->
export async function getStaticPaths() {
  const posts = await getCollection('essays');
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: post,
  }));
}
```

### After

```typescript
// src/utils/collections.ts
export async function getPublishedAndSorted(name: CollectionName) {
  const posts = await getCollection(name, ({ data }: any) => data.publish === true);
  return posts
    .map((post: any) => ({ ...post, collection: name }))
    .sort((a: any, b: any) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function getMultiCollectionPosts(names: CollectionName[]) {
  const collections = await Promise.all(names.map(name => getPublishedAndSorted(name)));
  return collections
    .flat()
    .sort((a: any, b: any) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function extractUniqueTags(posts: any[]): string[] {
  return ['all', ...new Set(posts.flatMap((post: any) => post.data.tags || []))].sort();
}

export async function getStaticPathsForCollection(name: CollectionName) {
  const posts = await getCollection(name);
  return posts.map((post: any) => {
    const parts = post.id.split('/');
    const last = parts[parts.length - 1] || '';
    const slug = typeof last === 'string' ? last.replace(/\.[^.]+$/, '').toLowerCase() : post.id;
    return { params: { slug }, props: post };
  });
}
```

```typescript
// src/utils/formatDate.ts
export function formatDate(date: Date, style: 'long' | 'short' = 'long'): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
  });
}
```

Now index pages shrink to a few lines:

```astro
<!-- src/pages/garden/index.astro (entire file) -->
---
import { GARDEN_COLLECTIONS } from '../../consts';
import { getMultiCollectionPosts, extractUniqueTags } from '../../utils/collections';
import IndexLayout from '../../layouts/IndexLayout.astro';

const allPosts = await getMultiCollectionPosts(['notes', 'essays', 'books', 'playground']);
const allTags = extractUniqueTags(allPosts);
---
<IndexLayout
  title="Garden"
  description="..."
  posts={allPosts}
  tags={allTags}
  collections={GARDEN_COLLECTIONS}
  showCollections={true}
  icon="/icons/garden.svg"
/>
```

And slug pages become one-liners:

```astro
<!-- src/pages/essays/[...slug].astro -->
export async function getStaticPaths() {
  return getStaticPathsForCollection('essays');
}
```

**Applied in:** `src/utils/collections.ts`, `src/utils/formatDate.ts`, all index pages (`garden`, `notes`, `essays`, `playground`, `series`), all slug pages (`notes/[...slug]`, `essays/[...slug]`, `playground/[...slug]`)

---

## 4. Component Consolidation (Variant Pattern)

**The smell:** Three near-identical card components existed — `EssayCard.astro`, `NoteCard.astro`, and `PlaygroundCard.astro`. They shared 90% of their markup and logic, differing only in whether they showed a hero image and the text sizing.

**The principle:** **Variant pattern.** When components differ by presentation but share structure, merge them into one component with a `variant` prop. The component itself decides what to render based on the variant.

### Before

```astro
<!-- src/components/EssayCard.astro -->
<div class="group rounded-lg overflow-hidden ...">
  <a href={url} class="block p-5 bg-syoro/5 rounded-xl ...">
    <img src={heroImage} ... />
    <h3 class="text-xl md:text-2xl lg:text-3xl ...">{title}</h3>
    <p>{description}</p>
    <time>{formattedDate}</time>
  </a>
</div>

<!-- src/components/NoteCard.astro (nearly identical, no image, smaller text) -->
<div class="group hover:scale-95 ...">
  <a href={url} class="block p-5 border-b-1 ...">
    <h3 class="text-lg md:text-xl lg:text-2xl ...">{title}</h3>
    <p>{description}</p>
    <time>{formattedDate}</time>
  </a>
</div>
```

### After

```astro
<!-- src/components/ContentCard.astro -->
---
import type { ContentCardProps } from '../types';
import { formatDate } from '../utils/formatDate';
import MaturityBadge from './MaturityBadge.astro';

type Props = ContentCardProps;
const {
  title = 'Untitled', description = '', pubDate, heroImage,
  url, imageHeight = 'h-48', maturity, collection,
  variant = 'card',
} = Astro.props;

const formattedDate = formatDate(pubDate);
const isCompact = variant === 'compact';
---

{isCompact ? (
  <!-- compact variant (was NoteCard) -->
  <div class="group hover:scale-95 transition-all duration-200">
    <a href={url} class="block p-5 border-b-1 ...">
      <h3 class="text-lg md:text-xl lg:text-2xl ...">{title}</h3>
      ...
    </a>
  </div>
) : (
  <!-- card variant (was EssayCard/PlaygroundCard) -->
  <div class="group rounded-lg overflow-hidden ...">
    <a href={url} class="block p-5 bg-syoro/5 rounded-xl ...">
      {heroImage && <img src={heroImage} ... />}
      <h3 class="text-xl md:text-2xl lg:text-3xl ...">{title}</h3>
      ...
    </a>
  </div>
)}
```

Usage in `GardenCards.astro` picks the variant based on collection:

```astro
const cardVariantCollections = new Set(['essays', 'playground']);

<ContentCard
  variant={cardVariantCollections.has(post.collection) ? 'card' : 'compact'}
  ...
/>
```

**Applied in:** `src/components/ContentCard.astro` (new), `src/components/garden/GardenCards.astro`. Deleted: `EssayCard.astro`, `NoteCard.astro`, `PlaygroundCard.astro`.

---

## 5. Extracting Repeated Markup

**The smell:** An 8-line block showing a maturity icon + label was copy-pasted across 4 components. Each had slight differences in class names, making it hard to update consistently.

**The principle:** **Extract markup into components.** Even small blocks of repeated HTML deserve their own component if they appear in 3+ places and carry their own logic (like looking up the icon from the maturity level).

### Before

```astro
<!-- Duplicated in NoteCard, EssayCard, PlaygroundCard, WorkCard... -->
<span>·</span>
<div class="flex items-center gap-1">
  <img src={getMaturityIcon(maturity)} alt={`${maturity} maturity`} class="w-4 h-4" />
  <span class="text-base font-sans uppercase tracking-wide text-syoro/50">{maturity}</span>
</div>
```

### After

```astro
<!-- src/components/MaturityBadge.astro -->
---
import type { Maturity } from '../types';
import { getMaturityIcon } from '../utils/maturityIcons';

interface Props {
  maturity: Maturity;
  iconClass?: string;
  textClass?: string;
}

const {
  maturity,
  iconClass = 'w-4 h-4',
  textClass = 'text-base font-sans uppercase tracking-wide text-syoro/50'
} = Astro.props;
const maturityIcon = getMaturityIcon(maturity);
---

<span>·</span>
<div class="flex items-center gap-1">
  <img src={maturityIcon} alt={`${maturity} maturity`} class={iconClass} />
  <span class={textClass}>{maturity}</span>
</div>
```

Usage:

```astro
{maturity && <MaturityBadge maturity={maturity} iconClass="w-4 h-auto" />}
```

**Applied in:** `src/components/MaturityBadge.astro` (new), `src/components/ContentCard.astro`, `src/components/WorkCard.astro`, `src/components/WorkCardCompact.astro`

---

## 6. The `initOnLoad` Wrapper

**The smell:** Every `<script>` block in every component had the same two-line initialization pattern:

```typescript
document.addEventListener('DOMContentLoaded', init);
document.addEventListener('astro:page-load', init);
```

This appeared 13+ times across the codebase. It's also a subtle bug magnet — forget one of the two listeners and your script breaks on either first load or page transitions.

**The principle:** **Encapsulate boilerplate.** When a pattern must always be used together (DOMContentLoaded + astro:page-load), wrap it in a function so developers can't accidentally use one without the other.

### Before

```typescript
// In every component's <script> block
function init() { /* ... */ }

document.addEventListener('DOMContentLoaded', init);
document.addEventListener('astro:page-load', init);
```

### After

```typescript
// src/utils/initOnLoad.ts
export function initOnLoad(fn: () => void) {
  document.addEventListener('DOMContentLoaded', fn);
  document.addEventListener('astro:page-load', fn);
}
```

Usage:

```typescript
import { initOnLoad } from '../utils/initOnLoad';

function init() { /* ... */ }
initOnLoad(init);
```

**Applied in:** `src/utils/initOnLoad.ts` (new), `src/components/Footer.astro`, `src/components/Navigation.astro`, `src/components/ThemeToggle.astro`, `src/components/CustomCursor.astro`, `src/components/garden/GardenCards.astro`, `src/scripts/linkTooltips.ts`, and others

---

## 7. Data-Driven Templates

**The smell:** The Footer had 5 hardcoded `<a>` blocks for social links, each with an inline SVG containing two `<path>` elements. Adding a new social link meant copy-pasting 10+ lines of HTML and carefully editing SVG path data inline.

**The principle:** **Separate data from presentation.** Move the data (URLs, labels, SVG paths) into a data structure, then `.map()` over it in the template. Adding a new link becomes adding an object to an array.

### Before

```astro
<!-- src/components/Footer.astro (5 blocks like this) -->
<a href="mailto:ruwaizrazak@gmail.com" target="_blank" rel="noopener noreferrer" class="u-email contact-link">
  <svg class="contact-icon w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path class="contact-icon-diamond" fill="currentColor" d="M12,2 L22,12 L12,22 L2,12 Z" />
    <path class="contact-icon-symbol" fill="none" stroke="currentColor" stroke-linecap="round"
      stroke-linejoin="round" stroke-width="2"
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7..." />
  </svg>
  <span>Email</span>
</a>
<!-- repeat for LinkedIn, GitHub, Mastodon, Bluesky... -->
```

### After

Data in `src/consts.ts` (see section 2), template in Footer:

```astro
<!-- src/components/Footer.astro -->
---
import { SOCIAL_LINKS } from '../consts';
---

{SOCIAL_LINKS.map((link) => (
  <a href={link.href} target="_blank" rel={link.rel} class={link.class}>
    <svg class={link.svgClass || 'contact-icon w-6 h-6 flex-shrink-0'} viewBox="0 0 24 24" fill="currentColor">
      <path class="contact-icon-diamond" fill="currentColor" d={link.diamondPath} />
      {link.symbolFill === 'stroke' ? (
        <path class="contact-icon-symbol" fill="none" stroke="currentColor"
          stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={link.symbolPath} />
      ) : (
        <path class="contact-icon-symbol" fill="currentColor" d={link.symbolPath} />
      )}
    </svg>
    <span>{link.label}</span>
  </a>
))}
```

**Applied in:** `src/consts.ts` (SOCIAL_LINKS array), `src/components/Footer.astro`

---

## 8. Readable Long Strings

**The smell:** The Tailwind prose class string was a single ~1500-character line. Impossible to scan, easy to introduce typos, painful to review in diffs.

**The principle:** **Group related values and join.** Break long strings into an array of logically grouped items with comments, then `.join(' ')` them. Every edit now shows up as a clean, readable diff line.

### Before

```typescript
// src/utils/proseClasses.ts
export const proseClasses = 'prose prose-neutral prose-lg dark:prose-invert max-w-3xl prose-p:font-serif prose-p:text-syoro prose-p:leading-relaxed prose-headings:font-sans prose-headings:text-syoro prose-headings:mb-6 prose-h1:text-5xl md:prose-h1:text-6xl prose-h1:font-medium prose-h2:text-4xl md:prose-h2:text-5xl ...'; // 1500+ chars
```

### After

```typescript
// src/utils/proseClasses.ts
export const proseClasses = [
  // Base
  'prose prose-neutral prose-lg dark:prose-invert max-w-3xl',
  // Paragraphs
  'prose-p:font-serif prose-p:text-syoro prose-p:leading-relaxed',
  // Headings
  'prose-headings:font-sans prose-headings:text-syoro prose-headings:mb-6',
  'prose-h1:text-5xl md:prose-h1:text-6xl prose-h1:font-medium',
  'prose-h2:text-4xl md:prose-h2:text-5xl prose-h2:font-medium',
  'prose-h3:text-3xl md:prose-h3:text-4xl',
  'prose-h4:text-2xl md:prose-h4:text-3xl prose-h4:font-medium',
  'prose-h5:text-xl md:prose-h5:text-2xl prose-h5:font-medium',
  // Heading spacing
  'prose-h1:mt-10 md:prose-h1:mt-20',
  'prose-h2:mt-8 md:prose-h2:mt-16',
  'prose-h3:mt-6 md:prose-h3:mt-12',
  'prose-h4:mt-3 md:prose-h4:mt-6',
  // Images
  'prose-img:w-[95%] prose-img:aspect-auto',
  // Strong
  'prose-strong:text-syoro prose-strong:font-bold',
  // Blockquotes
  'prose-blockquote:font-handwriting prose-blockquote:italic',
  'prose-blockquote:text-konpeki prose-blockquote:border-konpeki',
  'prose-blockquote:text-2xl prose-blockquote:leading-relaxed prose-blockquote:pl-6',
  // Lists
  'prose-ul:font-serif prose-li:font-serif prose-ul:list-disc prose-ol:list-decimal',
  // Font size
  'text-lg md:text-xl',
].join(' ');
```

**Applied in:** `src/utils/proseClasses.ts`

---

## Summary

| # | Technique | Files touched | Core principle |
|---|-----------|---------------|----------------|
| 1 | Shared types | 5+ | Single source of truth |
| 2 | Centralized constants | 6+ | Don't repeat magic values |
| 3 | Utility functions | 10+ | Extract repeated logic |
| 4 | Variant pattern | 4 (3 deleted) | Merge similar components |
| 5 | Markup extraction | 5 | Small reusable components |
| 6 | `initOnLoad` wrapper | 7+ | Encapsulate boilerplate |
| 7 | Data-driven templates | 2 | Separate data from presentation |
| 8 | Readable long strings | 1 | Array + join for maintainability |

The common thread: **every optimization reduces the number of places you need to touch when something changes.** That's the real goal — not fewer lines of code, but fewer places where a change can go wrong.
