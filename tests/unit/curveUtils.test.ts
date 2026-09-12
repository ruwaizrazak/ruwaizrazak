import { describe, it, expect } from 'vitest';
import { curveY, curveNormalAngle } from '../../src/scripts/garden/curveUtils';

// `b` is the ellipse's vertical radius; it animates 110 → 0 as the strip flattens.
describe('curveY', () => {
  it('is flat when the curve has collapsed', () => {
    expect(curveY(50, 100, 0)).toBe(0);
  });

  it('guards against a zero-width strip', () => {
    expect(curveY(50, 0, 110)).toBe(0);
    expect(curveY(50, -10, 110)).toBe(0);
  });

  it('peaks at the midpoint — y is 0 at the top of the arc', () => {
    expect(curveY(50, 100, 110)).toBeCloseTo(0, 10);
  });

  it('drops to the full radius at both edges', () => {
    expect(curveY(0, 100, 110)).toBeCloseTo(110, 10);
    expect(curveY(100, 100, 110)).toBeCloseTo(110, 10);
  });

  it('is symmetric about the midpoint', () => {
    expect(curveY(25, 100, 110)).toBeCloseTo(curveY(75, 100, 110), 10);
  });

  it('increases monotonically from centre to edge', () => {
    const samples = [50, 60, 70, 80, 90].map((x) => curveY(x, 100, 110));
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThan(samples[i - 1]);
    }
  });

  it('clamps to the radius outside the strip rather than returning NaN', () => {
    expect(curveY(150, 100, 110)).toBe(110);
    expect(Number.isNaN(curveY(-50, 100, 110))).toBe(false);
  });
});

describe('curveNormalAngle', () => {
  it('points straight up on a flat curve', () => {
    expect(curveNormalAngle(50, 100, 0)).toBeCloseTo(-Math.PI / 2, 10);
  });

  it('points straight up at the apex', () => {
    expect(curveNormalAngle(50, 100, 110)).toBeCloseTo(-Math.PI / 2, 10);
  });

  it('guards against a zero-width strip', () => {
    expect(curveNormalAngle(50, 0, 110)).toBeCloseTo(-Math.PI / 2, 10);
  });

  it('mirrors either side of the apex', () => {
    // atan2(-1, dydx) always lands in (-pi, 0), so both sides are negative —
    // the symmetry shows up as the pair summing to -pi, not as opposite signs.
    const left = curveNormalAngle(25, 100, 110);
    const right = curveNormalAngle(75, 100, 110);
    expect(left).toBeLessThan(-Math.PI / 2);
    expect(right).toBeGreaterThan(-Math.PI / 2);
    expect(left + right).toBeCloseTo(-Math.PI, 10);
  });

  it('never returns NaN near the edges, where the derivative blows up', () => {
    for (const x of [0, 0.5, 99.5, 100]) {
      expect(Number.isNaN(curveNormalAngle(x, 100, 110))).toBe(false);
    }
  });
});
