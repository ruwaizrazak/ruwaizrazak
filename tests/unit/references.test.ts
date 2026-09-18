import { describe, expect, it } from 'vitest';
import { coverUrl, gardenTarget, groupReferences, hostLabel, referenceKind } from '../../src/utils/references';

describe('referenceKind', () => {
  it('treats an entry with no URL as a book', () => {
    expect(referenceKind({ title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman' })).toBe('book');
    expect(referenceKind({ title: 'Blank URL', url: '   ' })).toBe('book');
  });

  it('treats links to this site as garden entries', () => {
    expect(referenceKind({ title: 'A note', url: '/notes/prompting/' })).toBe('garden');
    expect(referenceKind({ title: 'An essay', url: 'https://www.ruwaizrazak.com/essays/aidsingames' })).toBe('garden');
    expect(referenceKind({ title: 'Bare host', url: 'https://ruwaizrazak.com/series/x/' })).toBe('garden');
  });

  it('treats every other link as the web', () => {
    expect(referenceKind({ title: 'Flow', url: 'https://www.gamedeveloper.com/design/flow' })).toBe('web');
    expect(referenceKind({ title: 'Look-alike host', url: 'https://notruwaizrazak.com/x' })).toBe('web');
  });

  it('lets an explicit kind override the inference, except that garden and web need a URL', () => {
    expect(referenceKind({ title: 'Book with a shop link', url: 'https://example.com/buy', kind: 'book' })).toBe('book');
    expect(referenceKind({ title: 'Own site, filed as web', url: '/notes/x/', kind: 'web' })).toBe('web');
    expect(referenceKind({ title: 'Web with no URL', kind: 'web' })).toBe('book');
  });
});

describe('coverUrl', () => {
  it('builds an Open Library cover URL from a cleaned ISBN', () => {
    expect(coverUrl('978-0-465-05065-9')).toBe('https://covers.openlibrary.org/b/isbn/9780465050659-M.jpg');
    expect(coverUrl('080442957x')).toBe('https://covers.openlibrary.org/b/isbn/080442957X-M.jpg');
  });

  it('returns null without a usable ISBN', () => {
    expect(coverUrl(undefined)).toBeNull();
    expect(coverUrl(' - ')).toBeNull();
  });
});

describe('hostLabel', () => {
  it('drops the protocol, path and a leading www.', () => {
    expect(hostLabel('https://www.gamedeveloper.com/design/the-flow')).toBe('gamedeveloper.com');
    expect(hostLabel('https://www.blog.udonis.co/mobile-marketing')).toBe('blog.udonis.co');
    expect(hostLabel('https://digitalartistleague.medium.com/559#:~:text=x')).toBe('digitalartistleague.medium.com');
  });
});

describe('gardenTarget', () => {
  it('turns an absolute site URL into a site-relative path and reads its collection', () => {
    expect(gardenTarget('https://www.ruwaizrazak.com/essays/aidsingames')).toEqual({ href: '/essays/aidsingames', collection: 'essays' });
    expect(gardenTarget('/notes/prompting/#part-2')).toEqual({ href: '/notes/prompting/#part-2', collection: 'notes' });
  });

  it('leaves the collection null for a path outside the collections', () => {
    expect(gardenTarget('https://ruwaizrazak.com/about/')).toEqual({ href: '/about/', collection: null });
  });
});

describe('groupReferences', () => {
  it('sorts the AidsinGames references into books and the web, in their original order', () => {
    const groups = groupReferences([
      { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman' },
      { title: 'Flow: The Psychology of Optimal Experience', author: 'Csikszentmihalyi, Mihaly' },
      { title: 'MFA Thesis: Flow in Games', author: 'Jenova Chen ' },
      {
        title: 'The Flow Applied to Game Design',
        url: 'https://www.gamedeveloper.com/design/the-flow-applied-to-game-design',
        author: 'Daniel Berube',
        year: 'March 20 2019',
      },
    ]);

    expect(groups.books.map((book) => book.title)).toEqual([
      'Thinking, Fast and Slow',
      'Flow: The Psychology of Optimal Experience',
      'MFA Thesis: Flow in Games',
    ]);
    expect(groups.books[2]).toEqual({ title: 'MFA Thesis: Flow in Games', href: null, author: 'Jenova Chen', meta: '', cover: null });
    expect(groups.garden).toEqual([]);
    expect(groups.web).toEqual([
      {
        title: 'The Flow Applied to Game Design',
        href: 'https://www.gamedeveloper.com/design/the-flow-applied-to-game-design',
        byline: 'Daniel Berube · March 20 2019',
        host: 'gamedeveloper.com',
      },
    ]);
  });

  it('builds book meta, covers and garden labels', () => {
    const groups = groupReferences([
      { title: 'The Design of Everyday Things', author: 'Don Norman', year: '1988', publisher: 'Basic Books', isbn: '9780465050659' },
      { title: 'Notes on prompting', url: 'https://www.ruwaizrazak.com/notes/prompting' },
      { title: 'About', url: '/about/' },
    ]);

    expect(groups.books[0]).toEqual({
      title: 'The Design of Everyday Things',
      href: null,
      author: 'Don Norman',
      meta: '1988 · Basic Books',
      cover: 'https://covers.openlibrary.org/b/isbn/9780465050659-M.jpg',
    });
    expect(groups.garden).toEqual([
      { title: 'Notes on prompting', href: '/notes/prompting', collection: 'notes', label: 'Note' },
      { title: 'About', href: '/about/', collection: null, label: 'Garden' },
    ]);
    expect(groups.web).toEqual([]);
  });

  it('returns three empty groups for no references', () => {
    expect(groupReferences([])).toEqual({ books: [], garden: [], web: [] });
  });
});
