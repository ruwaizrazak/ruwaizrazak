// Elliptical curve math for the garden strip's top edge.
// `b` is the vertical radius — it animates from 110 to 0 as the strip flattens.

export function curveY(x: number, stripWidth: number, b: number): number {
  if (stripWidth <= 0 || b <= 0) return 0;
  const t = 2 * (x / stripWidth) - 1; // -1 to 1
  const inner = 1 - t * t;
  return inner <= 0 ? b : b * (1 - Math.sqrt(inner));
}

export function curveNormalAngle(x: number, w: number, b: number): number {
  if (w <= 0 || b <= 0) return -Math.PI / 2;
  const t = 2 * (x / w) - 1;
  const inner = 1 - t * t;
  if (inner <= 0.001) return -Math.PI / 2;
  const dydx = (2 * b / w) * t / Math.sqrt(inner);
  return Math.atan2(-1, dydx);
}

export function positionAlongCurve(
  strip: HTMLElement,
  b: number,
  selector: string,
  transform = 'translate(-50%, -100%)'
) {
  const w = strip.offsetWidth;
  const elements = strip.querySelectorAll<HTMLElement>(selector);
  const n = elements.length;
  if (n === 0 || w <= 0) return;
  elements.forEach((el, i) => {
    const x = ((i + 1) / (n + 1)) * w;
    const y = curveY(x, w, b);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = transform;
  });
}

export function positionPlantsAlongCurve(strip: HTMLElement, b: number) {
  positionAlongCurve(strip, b, '.plant-icon');
}

export function positionTreesAlongCurve(strip: HTMLElement, b: number) {
  positionAlongCurve(strip, b, '.tree-item');
}

export function positionFlowersAlongCurve(strip: HTMLElement, b: number) {
  positionAlongCurve(strip, b, '.flower-item');
}
