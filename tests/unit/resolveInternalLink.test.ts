import { describe, it, expect, beforeEach } from 'vitest';
import { __setCollections, __reset } from '../helpers/astro-content-stub';
import { resolveInternalLink } from '../../src/utils/resolveInternalLink';

beforeEach(() => {
  __reset();
  __setCollections({
    essays: [
      { id: 'my-post', data: { title: 'My Post', description: 'An essay.' } },
      { id: 'nested/Deep-Post', data: { title: 'Deep Post', description: 'Nested.' } },
      { id: 'untitled', data: {} },
    ],
    notes: [{ id: 'whythissite', data: { title: 'Why This Site', description: 'Because.' } }],
    works: [{ id: '01Farmville3', data: { title: 'Farmville 3', description: 'A game.' } }],
  });
});

describe('resolveInternalLink', () => {
  it('resolves a /garden/ href against the essays collection', async () => {
    // The route and the collection are deliberately not 1:1 — /garden serves essays.
    expect(await resolveInternalLink('/garden/my-post')).toEqual({
      title: 'My Post',
      description: 'An essay.',
    });
  });

  it('tolerates a trailing slash', async () => {
    expect(await resolveInternalLink('/notes/whythissite/')).toEqual({
      title: 'Why This Site',
      description: 'Because.',
    });
  });

  it('matches case-insensitively on the derived slug', async () => {
    const result = await resolveInternalLink('/garden/deep-post');
    expect(result?.title).toBe('Deep Post');
  });

  it('also matches the raw entry id, for works with generated ids', async () => {
    const result = await resolveInternalLink('/works/01Farmville3');
    expect(result?.title).toBe('Farmville 3');
  });

  it('returns null for a route with no collection mapping', async () => {
    expect(await resolveInternalLink('/playground/anything')).toBeNull();
  });

  it('returns null for a single-segment href', async () => {
    expect(await resolveInternalLink('/notes')).toBeNull();
    expect(await resolveInternalLink('/')).toBeNull();
  });

  it('returns null when nothing in the collection matches', async () => {
    expect(await resolveInternalLink('/notes/does-not-exist')).toBeNull();
  });

  it('returns null when the entry carries neither title nor description', async () => {
    expect(await resolveInternalLink('/garden/untitled')).toBeNull();
  });
});
