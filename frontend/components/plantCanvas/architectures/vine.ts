import { PlantDNA } from "../../../types";
import { DrawState } from "../types";
import { drawStippledCurve, drawRadialNode, drawWordStem } from "../primitives";

export function drawOrganicVine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  state: DrawState,
  dna: PlantDNA,
  initialAngle: number = 0,
  curveBias: number = 0,
  lengthMultiplier: number = 1,
  spreadFactor: number = 1,
  individualGrowth: number = 1,
): void {
  const maxSegments = 70;
  let cx = x,
    cy = y;
  let angle = initialAngle;

  const segmentLen = 10 * lengthMultiplier;

  const bassSegments = Math.floor(maxSegments * 0.3 * (state.bass.growth / 100) * individualGrowth);
  const midSegments = Math.floor(maxSegments * 0.3 * (state.mid.growth / 100) * individualGrowth);
  const trebleSegments = Math.floor(maxSegments * 0.4 * (state.treble.growth / 100) * individualGrowth);
  const totalSegments = bassSegments + midSegments + trebleSegments;

  const startX = x;
  const startY = y;

  for (let i = 0; i < totalSegments; i++) {
    let currentPulse = 0;
    if (i < bassSegments) {
      currentPulse = state.bass.pulse;
    } else if (i < bassSegments + midSegments) {
      currentPulse = state.mid.pulse;
    } else {
      currentPulse = state.treble.pulse;
    }

    const mouseInfluence = state.mouse.active
      ? Math.max(
          0,
          1 -
            Math.hypot(cx - state.mouse.x, cy - state.mouse.y) /
              200,
        )
      : 0;

    const sway =
      Math.sin(i * 0.3 + state.wind) * 8 * spreadFactor +
      mouseInfluence * 8;
    const curve =
      Math.cos(i * 0.1) * (dna.angleVariance / 5) + curveBias * 0.05;

    if (mouseInfluence > 0.1) {
      const dx = state.mouse.x - cx;
      const dy = state.mouse.y - cy;
      const attractAngle = Math.atan2(dy, dx);
      angle =
        angle * (1 - mouseInfluence * 0.1) +
        attractAngle * mouseInfluence * 0.1;
    }

    angle += (curve + sway * 0.1) * 0.1;

    const nx = cx + Math.sin(angle) * segmentLen;
    const ny = cy + Math.cos(angle) * segmentLen;

    const cpX = (cx + nx) / 2 + sway;
    const cpY = (cy + ny) / 2;

    const pulseScale = 1 + currentPulse * 0.6;
    const stemWidth = Math.max(1.5, 5 - i * 0.08) * pulseScale;

    drawStippledCurve(ctx, cx, cy, cpX, cpY, nx, ny, stemWidth, dna.colorPalette[0] ?? "#2d3436", state);

    const nodeInterval = 6;
    if (i % nodeInterval === 0 && i > 0) {
      const baseNodeRadius = 4 + (i / totalSegments) * 6;
      const nodeRadius = baseNodeRadius * pulseScale;
      const fillColor =
        Math.floor(i / nodeInterval) % 2 === 0
          ? dna.colorPalette[1]
          : dna.colorPalette[2];
      const strokeColor = dna.colorPalette[0];
      drawRadialNode(ctx, nx, ny, nodeRadius, fillColor ?? "#5fb895", strokeColor ?? "#2d3436", state);
    }

    const wordInterval = 12;
    if (i % wordInterval === 0 && i > 0 && i < totalSegments / 2) {
      drawWordStem(ctx, startX, startY, nx, ny, dna.colorPalette[0] ?? "#2d3436", state);
    }

    if (i % 4 === 0) {
      const leafBaseAngle = state.time + i;
      const leafCount = 2 + Math.floor(Math.random() * 2);
      const leafOrbitRadius = 8 * pulseScale;

      for (let l = 0; l < leafCount; l++) {
        const leafAngle = leafBaseAngle + (Math.PI * 2 * l) / leafCount;
        const lx = nx + Math.cos(leafAngle) * leafOrbitRadius;
        const ly = ny + Math.sin(leafAngle) * leafOrbitRadius;
        const leafRadius = 2 + Math.random();

        drawRadialNode(ctx, lx, ly, leafRadius, dna.colorPalette[1] ?? "#5fb895", dna.colorPalette[0] ?? "#2d3436", state);
      }
    }

    cx = nx;
    cy = ny;
  }
}
