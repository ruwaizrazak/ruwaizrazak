import { describe, it, expect } from 'vitest';
import { getMaturityIcon } from '../../src/utils/maturityIcons';

describe('getMaturityIcon', () => {
  it('maps each maturity level to its icon', () => {
    expect(getMaturityIcon('seed')).toBe('/icons/seed.svg');
    expect(getMaturityIcon('plant')).toBe('/icons/plant.svg');
    expect(getMaturityIcon('tree')).toBe('/icons/tree.svg');
  });

  it('defaults to seed when called with no argument', () => {
    expect(getMaturityIcon()).toBe('/icons/seed.svg');
  });

  it('falls back to seed for an unrecognised value', () => {
    // Content could carry a stale maturity after a schema change.
    expect(getMaturityIcon('sapling' as never)).toBe('/icons/seed.svg');
  });
});
