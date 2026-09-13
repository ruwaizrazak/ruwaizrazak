// Refactored from a single ~1500-char string into a grouped array for readability and maintainable diffs.
//
// LEARN: two scales on purpose, NOT a fork waiting to be reconciled.
//   proseClasses         -> about.astro, live/index.astro, embed/works/[...slug].astro
//   notePostProseClasses -> NoteMain.astro only, i.e. every page that renders
//                           through notesPost.astro (/notes, /essays, /series
//                           parts, /playground posts)
// notePostProseClasses carries the Note Post design's fixed roles (body 20/1.65,
// h2 40/1.1, h3 28/1.2) with a step-down below md; proseClasses keeps the older
// responsive Tailwind ladder for pages that are not note posts.

export const proseClasses = [
  // Base
  'prose prose-neutral prose-lg dark:prose-invert max-w-4xl',
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
  'prose-img:w-full prose-img:aspect-auto',
  // Strong
  'prose-strong:text-syoro prose-strong:font-bold',
  // Blockquotes — styled centrally in global.css (`.prose blockquote`) so the
  // editorial hanging-mark look stays in one place and matches the <Quote> component.
  // Lists
  'prose-ul:font-serif prose-li:font-serif prose-ul:list-disc prose-ol:list-decimal',
  // Font size
  'text-lg md:text-xl xl:text-2xl',
].join(' ');

export const notePostProseClasses = [
  // Base
  'prose prose-neutral dark:prose-invert max-w-[760px]',
  // Paragraphs
  // LEARN: The design rhythm uses margins here rather than container gap,
  // because @tailwindcss/typography already owns prose element spacing.
  'prose-p:my-5 md:prose-p:my-7 prose-p:font-serif prose-p:text-syoro prose-p:text-lg md:prose-p:text-[20px] prose-p:leading-[1.65]',
  // Headings
  'prose-headings:font-sans prose-headings:text-syoro prose-headings:font-medium',
  'prose-h1:text-4xl md:prose-h1:text-[56px] prose-h1:leading-[1]',
  'prose-h2:text-3xl md:prose-h2:text-[40px] prose-h2:leading-[1.1] prose-h2:tracking-[-0.01em]',
  'prose-h3:text-2xl md:prose-h3:text-[28px] prose-h3:leading-[1.2]',
  'prose-h4:text-xl md:prose-h4:text-2xl prose-h4:leading-tight',
  'prose-h5:text-lg md:prose-h5:text-xl prose-h5:leading-tight',
  // Heading spacing
  'prose-h1:mt-10 md:prose-h1:mt-16 prose-h1:mb-5',
  'prose-h2:mt-9 md:prose-h2:mt-9 prose-h2:mb-5',
  'prose-h3:mt-5 md:prose-h3:mt-5 prose-h3:mb-4',
  'prose-h4:mt-5 prose-h4:mb-3',
  // Images
  'prose-img:w-full prose-img:aspect-auto',
  // Strong
  'prose-strong:text-syoro prose-strong:font-bold',
  // Blockquotes — styled centrally in global.css (`.prose blockquote`) so the
  // editorial hanging-mark look stays in one place and matches the <Quote> component.
  // Lists
  'prose-ul:font-serif prose-ol:font-serif prose-li:font-serif prose-ul:list-disc prose-ol:list-decimal',
  'prose-ul:pl-6 prose-ol:pl-6 prose-li:my-2.5 prose-li:text-lg md:prose-li:text-[20px] prose-li:leading-[1.65]',
  // Inline code + captions
  'prose-code:rounded prose-code:bg-syoro/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-base md:prose-code:text-[17px] prose-code:text-syoro',
  'prose-figcaption:font-sans prose-figcaption:text-[15px] prose-figcaption:tracking-[0.1em] prose-figcaption:uppercase prose-figcaption:text-muted',
].join(' ');
