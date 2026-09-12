import { describe, it, expect } from 'vitest';
import { isRemote, resolveImage } from '../../src/utils/resolveImage';

// resolveImage's hit path depends on import.meta.glob over src/assets, whose
// contents change as images are added — asserting a specific file would make
// this test a maintenance tax. The branches that matter are the guards.
describe('isRemote', () => {
  it('recognises absolute http(s) URLs', () => {
    expect(isRemote('https://i.imgur.com/x.png')).toBe(true);
    expect(isRemote('http://example.com/x.png')).toBe(true);
  });

  it('treats public-style paths and empty input as local', () => {
    expect(isRemote('/works/fv3/fv33.webp')).toBe(false);
    expect(isRemote('')).toBe(false);
    expect(isRemote(undefined)).toBe(false);
  });
});

describe('resolveImage', () => {
  it('returns undefined for remote URLs so callers fall back to a plain img', () => {
    expect(resolveImage('https://i.imgur.com/x.png')).toBeUndefined();
  });

  it('returns undefined for a missing path', () => {
    expect(resolveImage(undefined)).toBeUndefined();
    expect(resolveImage('')).toBeUndefined();
  });

  it('returns undefined when no asset matches', () => {
    expect(resolveImage('/does/not/exist.webp')).toBeUndefined();
  });
});
