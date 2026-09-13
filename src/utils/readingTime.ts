const FRONTMATTER_RE = /^---[\s\S]*?---/;
const FENCED_CODE_RE = /```[\s\S]*?```|~~~[\s\S]*?~~~/g;
const INLINE_CODE_RE = /`[^`\n]*`/g;
// LEARN: link TARGETS must be stripped before the syntax pass below removes the
// brackets around them. Strip them after, and the URL is already orphaned from
// its `](...)` wrapper — every path segment then counts as a word and a
// link-heavy post reads several minutes longer than it is.
const MD_LINK_TARGET_RE = /\]\([^)\s]*(?:\s+"[^"]*")?\)/g;
const AUTOLINK_RE = /<https?:\/\/[^>\s]*>/g;
const BARE_URL_RE = /\bhttps?:\/\/\S+/g;
const MDX_TAG_RE = /<\/?[A-Z][^>]*>/g;
// `-` and `_` are deliberately absent: splitting on them turns "state-of-the-art"
// into four words and "snake_case_name" into three.
const MARKDOWN_SYNTAX_RE = /[#>*`~[\]()|:]/g;

export function readingTime(source: string, wpm = 200): number {
  const cleaned = source
    .replace(FRONTMATTER_RE, ' ')
    .replace(FENCED_CODE_RE, ' ')
    .replace(INLINE_CODE_RE, ' ')
    .replace(MD_LINK_TARGET_RE, ') ')
    .replace(AUTOLINK_RE, ' ')
    .replace(BARE_URL_RE, ' ')
    .replace(MDX_TAG_RE, ' ')
    .replace(MARKDOWN_SYNTAX_RE, ' ');

  const words =
    cleaned.match(/\b[\p{L}\p{N}]+(?:[-_'’][\p{L}\p{N}]+)*\b/gu)?.length ?? 0;
  return Math.max(1, Math.ceil(words / wpm));
}
