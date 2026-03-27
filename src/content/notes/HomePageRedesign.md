---
title: 'Home Page Architecture'
description: 'Documentation of the home page redesign — layout, animation system, component structure, and data flow.'
pubDate: 'Mar 10 2026'
tags: ['tech']
featured: false
maturity: 'seed'
publish: false
---

## Home Page Architecture

### Overview
The home page (`src/pages/index.astro`) is a centered, minimal layout with a hero intro section and a vertically stacked list of work case studies. It uses Astro view transitions and CSS entrance animations.

### Page Structure

```
index.astro
├── BaseHead (SEO, fonts, global CSS)
├── ClientRouter (Astro view transitions)
├── <script is:inline> (entrance animation logic)
├── <main>
│   ├── Header (logo + nav)
│   ├── Hero Section (#Intro-text) — centered text
│   │   ├── h1 "Hi, I'm Ruwaiz"
│   │   ├── p — tagline
│   │   └── p — "Currently building..." with Link
│   └── Works Section (#Works) — vertical stack
│       └── WorkCard × N
└── Footer (contact section with GSAP icon morphing)
```

### Components

#### WorkCard (`src/components/WorkCard.astro`)
Each work entry renders as a side-by-side card:
- **Left (~40%)**: Duration (small uppercase), Title (large serif), Role (bold), Description
- **Right (~60%)**: Hero image with rounded corners and subtle scale hover effect
- Stacks vertically on mobile (`flex-col` → `md:flex-row`)
- Data comes from `src/content/works/*.mdx` frontmatter:
  - `title`, `description`, `company`, `role`, `duration`, `heroImage`

#### Link (`src/components/mdxComponents/Link.astro`)
Animated underline link with hover color shift to `--color-konpeki`.

### Entrance Animation System

The page has two animation states managed via body/html classes:

#### First Visit (`animate-in`)
Applied when the user navigates to `/` for the first time (not returning from a work page).

```
body.animate-in .index-intro    → HeroSectionIntro (slide up 20px, fade in, 0.3s delay)
body.animate-in .work-cards-container → selectedSectionIntro (slide up 70px, fade in, 0.8s delay)
```

#### Return Visit (`returned-from-work`)
Applied when returning from `/works/*` (detected via `document.referrer` or `sessionStorage.skipIndexAnimations`).

```
body.returned-from-work .index-intro → opacity: 1, no animation
body.returned-from-work .work-cards-container → opacity: 1, no animation
```

#### Detection Logic (`<script is:inline>`)
1. On initial load: checks `document.referrer` for `/works/` or `sessionStorage.skipIndexAnimations`
2. On Astro page transitions (`astro:page-load`): re-applies the correct class to the new body element
3. Uses `requestAnimationFrame` double-tap for timing safety

#### How `skipIndexAnimations` Gets Set
The Navigation component (`src/components/Navigation.astro`) sets `sessionStorage.setItem('skipIndexAnimations', '1')` when the logo is clicked, so returning to the index doesn't replay the entrance animation.

### View Transitions
Each work card wrapper has `transition:name={work-${entry.id}}` for smooth morphing between the index and work detail pages. The `ClientRouter` component enables Astro's built-in view transition system.

### Footer Reveal Pattern
The footer uses a "reveal" pattern where it sits behind the main content (sticky, z-0) and becomes visible as you scroll past the content (z-1). Managed via `.footer-reveal` and `.footer-reveal-content` classes in `global.css`.

### Styling
- **Fonts**: IBM Plex Serif (body/headings), Saira Condensed (labels/UI), Caveat (logo)
- **Colors**: `--color-syoro` (text), `--color-backgroundcolor` (bg), `--color-link` (links)
- **Dark mode**: CSS variables swap in `@media (prefers-color-scheme: dark)` via `global.css`
- **Responsive padding**: `px-6 md:px-12 lg:px-20` on the main container

### Key Files
| File | Purpose |
|------|---------|
| `src/pages/index.astro` | Home page layout and animations |
| `src/components/WorkCard.astro` | Individual work case study card |
| `src/components/Header.astro` | Site header with navigation |
| `src/components/Navigation.astro` | Nav menu with animation skip logic |
| `src/components/Footer.astro` | Contact section with GSAP morphing |
| `src/components/mdxComponents/Link.astro` | Animated link component |
| `src/styles/global.css` | Theme colors, fonts, footer-reveal |
| `src/content/works/*.mdx` | Work entry content and frontmatter |
| `src/content.config.ts` | Collection schemas |
