// Refactored from a single ~1500-char string into a grouped array for readability and maintainable diffs.

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
