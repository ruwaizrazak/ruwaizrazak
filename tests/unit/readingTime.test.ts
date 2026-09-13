import { describe, expect, it } from 'vitest';
import { readingTime } from '../../src/utils/readingTime';

const words = (count: number) => Array.from({ length: count }, (_, index) => `word${index}`).join(' ');

describe('readingTime', () => {
  it('returns one minute for about 200 words', () => {
    expect(readingTime(words(200))).toBe(1);
  });

  it('rounds up longer reading times', () => {
    expect(readingTime(words(450))).toBe(3);
  });

  it('never returns zero for empty content', () => {
    expect(readingTime('')).toBe(1);
    expect(readingTime('   \n\t')).toBe(1);
  });

  it('excludes fenced code blocks from the count', () => {
    expect(readingTime(`${words(200)}\n\n\`\`\`ts\n${words(500)}\n\`\`\``)).toBe(1);
  });

  it('does not count MDX component tag names', () => {
    expect(readingTime(`<Callout type="insight">${words(200)}</Callout>`)).toBe(1);
  });

  it('excludes frontmatter', () => {
    expect(readingTime(`---\ntitle: ${words(500)}\n---\n${words(200)}`)).toBe(1);
  });

  it('honours a custom words-per-minute value', () => {
    expect(readingTime(words(450), 150)).toBe(3);
  });
  it('counts a hyphenated word once', () => {
    // Without this, splitting on "-" turns each term into four words and the
    // estimate quadruples.
    expect(readingTime(Array.from({ length: 200 }, () => 'state-of-the-art').join(' '))).toBe(1);
  });

  it('counts a snake_case word once', () => {
    expect(readingTime(Array.from({ length: 200 }, () => 'snake_case_name').join(' '))).toBe(1);
  });

  it('does not count markdown link targets', () => {
    const links = Array.from(
      { length: 40 },
      () => '[link](https://example.com/some/very/long/path/to/a/page)',
    ).join(' ');
    // 150 prose words + 40 link labels = 190 words. Counting the URLs too would
    // add ~9 tokens each and push this to 3 minutes.
    expect(readingTime(`${words(150)}\n\n${links}`)).toBe(1);
  });

  it('does not count bare or autolinked URLs', () => {
    const urls = Array.from({ length: 40 }, () => 'https://example.com/a/b/c/d/e/f').join(' ');
    expect(readingTime(`${words(150)}\n\n${urls}`)).toBe(1);
  });

  it('excludes inline code spans', () => {
    expect(readingTime(`${words(200)} \`${words(500)}\``)).toBe(1);
  });
});
