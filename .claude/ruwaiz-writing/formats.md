# Formats

Ruwaiz's site has four content types. Each has a different register, length, and set of conventions. Get the format right before drafting.

## 1. Live notes

Monthly reflective posts. The most casual format on the site.

**Filename pattern**: `[Month].mdx` or `[Month].md`

**Frontmatter**:
```yaml
---
Month: 'November'
OneLiner: 'Brief one-line summary of the month'
date: '2025-12-11'
publish: true
---
```

The `OneLiner` is short and lowercase-style ("Learning Swift again, finishing Ghost of Tsushima, and experimenting with AI-assisted writing"). Not a tagline, just a true sentence.

**Length**: 500–1200 words usually.

**Conventions**:
- Optional opening paragraph (no heading) that sets the mood for the month.
- `## Section Title 🎮` — subsections with optional emoji at the end of the heading. Not every section needs an emoji, but many do.
- Sections cover whatever was actually happening: health, learning, games, work, projects, gratitude, life.
- Includes work-in-progress thoughts. Doesn't have to be conclusive.
- Image embeds: `<img src="..." alt="..."/>`, or `<Image src="..." alt="..." />` for an optimised image with the zoomable lightbox.
- Internal links use the `<Link href="..." />` component (no import needed).

**Voice register**: Conversational, philosophical, slightly meandering. Asides and emojis welcome. Missing apostrophes are fine (he won't always fix them).

**Closing**: A single reflective beat that lingers. Not a summary of the month.

**Imports**: none. Every MDX component (`Link`, `Image`, `ImagesLeft`, `SideBySide`, `SideNote`, `Callout`, `Quote`, `TargetAudience`, `References`, …) is registered globally in `src/components/mdxComponents/map.ts`, so write the tag directly. Adding an `import` line is unnecessary, and a stale path breaks the build.

## 2. Notes

Short to medium pieces. Less polished than essays. The bridge format — "thoughts that may later grow into essays or series."

**Filename pattern**: `[TitleCamelCase].mdx`

**Frontmatter**:
```yaml
---
title: 'How to be a user experience designer'
description: 'A short framing of the note'
pubDate: 'Aug 31 2024'
updatedDate: 'Jul 08 2022'
heroImage: ''
tags: ['design']
featured: false
maturity: 'seed'
publish: true
---
```

**Maturity levels**: `seed` (rough), `plant` (developed), `tree` (refined). Notes are usually `seed` or `plant`.

**Length**: 400–1500 words.

**Conventions**:
- Title is sentence-case usually ("Why I Built This Site," "AI tools as Creative Partners").
- Section headings use `# H1` and `## H2`.
- Quotes use blockquotes with attribution after a dash: `> "Quote." - Author`
- Internal links via `<Link>` component.

**Voice register**: First-person, reflective, conversational. Less rigorous than essays. Hedges are welcome.

## 3. Essays

Long-form, researched, polished. The most refined format.

**Filename pattern**: `[TitleCamelCase].mdx`

**Frontmatter**:
```yaml
---
title: 'How Call of Duty is maintaining a loyal user base?'
description: 'Deconstructing one of the games Ive been playing for past 5 years'
pubDate: 'Feb 02 2025'
updatedDate: 'Mar 08 2025'
heroImage: '/essays/path/image.webp'
tags: ['design']
featured: true
maturity: 'tree'
publish: true
---
```

**Length**: 2000–6000+ words.

**Conventions**:
- Often includes `<TargetAudience description="..." />` near the top to frame who the piece is for.
- Heavy use of section headings: `# Section`, `## Subsection`, `### Sub-subsection`.
- Custom MDX components for layout: `<Image>`, `<ImagesLeft>`, `<SideBySide>`, `<SideNote>`, `<References>`.
- Citations and references at the end via `<References references={[...]} />` (usage below). It's registered globally in `mdxComponents/map.ts`, so it needs no import.
- Industry vocabulary used confidently (NURR, MAU, retention, archetypes, coreloop, meta loop).
- Still has voice: undercuts, asides, occasional emoji.

**Voice register**: Most rigorous, but still recognisably him. Don't over-formalise. The CODM essay is the model — analytical depth, casual seasoning.

**Imports**: none. Every MDX component (`Link`, `Image`, `ImagesLeft`, `SideBySide`, `SideNote`, `Callout`, `Quote`, `TargetAudience`, `References`, …) is registered globally in `src/components/mdxComponents/map.ts`, so write the tag directly. Adding an `import` line is unnecessary, and a stale path breaks the build.

**References**: one `<References>` block at the end of the piece. It renders as a grouped shelf, and the group comes from the URL:
- **no `url`** → *Books*: a cover card, not a link (add `isbn` for an Open Library cover)
- **a link to this site** (`/notes/…`, `https://www.ruwaizrazak.com/essays/…`) → *From the garden*: shows the collection's icon and label
- **any other link** → *On the web*: shows the byline and the site name

```mdx
<References
  references={[
    { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", year: "2011", publisher: "Farrar, Straus and Giroux", isbn: "9780374533557" },
    { title: "Why I Built This Site", url: "/notes/whythissite/" },
    { title: "The Flow Applied to Game Design", url: "https://www.gamedeveloper.com/design/the-flow-applied-to-game-design", author: "Daniel Berube", year: "March 20 2019" },
  ]}
/>
```

Fields: `title` (required), `url`, `author`, `year` (free text), `publisher` and `isbn` (books only), and `kind` (`'book' | 'garden' | 'web'`) to override the inferred group. An entry with no `url` is always a book. Keep the order you cite them in; it's preserved within each group.

## 4. Series posts

Episodic devlog-style writing, building on prior entries. Currently the "Portfolio to Garden" series.

**Filename pattern**: Inside `src/content/series/[series-slug]/[Post-Title].mdx`

**Frontmatter** (post):
```yaml
---
title: "Blogspot: The first patch of soil"
description: "Brief description"
pubDate: 2025-11-02
tags: ["blog", "portfolio"]
publish: true
maturity: "tree"
seriesOrder: 1
excerpt: "Short evocative pull-quote that captures the post's spirit"
---
```

**Length**: 800–2000 words.

**Conventions**:
- Each post has a `seriesOrder` (1, 2, 3...).
- The `excerpt` is a short evocative passage, often poetic — used as a pull-quote on the series listing page.
- Posts often reference previous and upcoming entries: "In the next part, I'll write about..."
- Conversational devlog voice — building, breaking, learning. Past tense.
- Light use of section headings (`# H1`, `## H2`).
- Internal links via `<Link>`.

**Voice register**: Storytelling. Tracing the arc of how he learned or built something. Often has a "looking back" tone — "I didn't know it then, but..."

**Closing**: Often hints at the next post in the series. Don't fully close the door.

## Picking the right format

If Ruwaiz hasn't said which format, infer from what he's describing:

- **Reflecting on the past month** → live note
- **Working through an idea, short to medium** → note
- **Deep analysis or a polished argument** → essay
- **Continuing a story he's been telling in pieces** → series

If unsure, ask him before drafting. The format affects everything — register, length, structure, frontmatter.

## A note on file output

When generating a draft, save it as `.md` or `.mdx` matching the existing files in that section of the site. **Never .docx** — this is an explicit preference. Use `.mdx` if the piece will need MDX components (links, images, custom components); `.md` if it's pure prose.
