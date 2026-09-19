import { describe, it, expect } from 'vitest';
import { coverSizes } from '../../src/utils/coverSizes';

const slots = [
  { media: '(min-width: 768px)', width: 'calc((100vw - 144px) * 2 / 3)' },
  { width: 'calc(100vw - 36px)' },
];

describe('coverSizes', () => {
  it('scales every slot by how much wider than the box the image draws', () => {
    // 1200×675 is 16:9; in a 4:3 box, cover draws it 1.333… × the slot width, rounded up.
    expect(coverSizes(slots, 4 / 3, 1200, 675)).toBe(
      '(min-width: 768px) calc(calc((100vw - 144px) * 2 / 3) * 1.34), calc(calc(100vw - 36px) * 1.34)',
    );
  });

  it('rounds up, never down, so the chosen file is never too small', () => {
    expect(coverSizes([{ width: '100vw' }], 4 / 3, 1600, 738)).toBe('calc(100vw * 1.63)');
    expect(coverSizes([{ width: '100vw' }], 16 / 10, 1600, 738)).toBe('calc(100vw * 1.36)');
  });

  it('leaves the slot alone when the image is no wider than the box', () => {
    expect(coverSizes([{ width: '100vw' }], 4 / 3, 1200, 900)).toBe('100vw');
    expect(coverSizes([{ width: '100vw' }], 4 / 3, 800, 800)).toBe('100vw');
  });
});
