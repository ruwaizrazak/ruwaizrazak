import { curveY, curveNormalAngle } from './curveUtils';

const BASE_CANVAS_H = 125;
const BASE_MAX_BLADE_H = 15;
const BLADE_COLORS = ['#00300e', '#003d12', '#002a0c', '#004a16', '#001f08'];

export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

export function initGrassCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  return canvas.getContext('2d');
}

export function sizeGrassCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  stripWidth: number,
  scale: number = 1
) {
  const canvasH = BASE_CANVAS_H * scale;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = stripWidth * dpr;
  canvas.height = canvasH * dpr;
  canvas.style.width = `${stripWidth}px`;
  canvas.style.height = `${canvasH}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}

export function drawGrass(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  stripWidth: number,
  b: number,
  scale: number = 1
) {
  const canvasH = BASE_CANVAS_H * scale;
  const maxBladeH = BASE_MAX_BLADE_H * scale;
  ctx.clearRect(0, 0, stripWidth, canvasH);

  for (let x = 0; x < stripWidth; x += 4) {
    const baseY = maxBladeH + curveY(x, stripWidth, b);
    const angle = curveNormalAngle(x, stripWidth, b);
    const bladeCount = 2 + Math.floor(seededRandom(x * 0.73) * 2);

    for (let j = 0; j < bladeCount; j++) {
      const seed = x * 13.7 + j * 47.3;
      const bladeHeight = (6 + seededRandom(seed) * 9) * scale;
      const lean = (seededRandom(seed + 1) - 0.5) * 0.4;
      const width = 1.5 + seededRandom(seed + 2) * 2.5;
      const bladeAngle = angle + lean;

      const tipX = x + Math.cos(bladeAngle) * bladeHeight;
      const tipY = baseY + Math.sin(bladeAngle) * bladeHeight;
      const cpX = x + Math.cos(bladeAngle + lean * 0.5) * bladeHeight * 0.6;
      const cpY = baseY + Math.sin(bladeAngle + lean * 0.5) * bladeHeight * 0.6;

      ctx.beginPath();
      ctx.moveTo(x - width / 2, baseY);
      ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
      ctx.quadraticCurveTo(cpX + width * 0.3, cpY, x + width / 2, baseY);
      ctx.closePath();

      ctx.fillStyle = BLADE_COLORS[Math.floor(seededRandom(seed + 3) * BLADE_COLORS.length)];
      ctx.fill();
    }
  }
}
