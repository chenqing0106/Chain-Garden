import { PlantDNA } from "../../../types";
import { DrawState } from "../types";
import { drawRadialNode, drawWordStem } from "../primitives";

export function drawDataBlossom(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number,
  state: DrawState,
  dna: PlantDNA,
): void {
  const bassProgress = state.bass.growth / 100;
  const midProgress = state.mid.growth / 100;
  const trebleProgress = state.treble.growth / 100;

  const bassPulse = state.bass.pulse;
  const midPulse = state.mid.pulse;
  const treblePulse = state.treble.pulse;

  const avgProgress = (bassProgress + midProgress + trebleProgress) / 3;
  const progress = avgProgress;

  const baseRadius = Math.min(width, height) * 0.5 * progress;

  const maxSpokes = Math.max(20, Math.floor(dna.branchingFactor * 7));
  const spokes = Math.floor(maxSpokes * Math.min(1, progress * 2));

  const nodeCount = Math.floor(progress * 15);

  const colorStem = dna.colorPalette[0] ?? "#2d3436";
  const colorNode = dna.colorPalette[1] ?? "#5fb895";
  const colorAccent = dna.colorPalette[2] ?? "#f4c095";

  if (progress > 0.01) {
    for (let i = 0; i < spokes; i++) {
      const angle = (Math.PI * 2 * i) / spokes;
      const sway =
        Math.sin(state.time * 0.8 + i) *
        (dna.angleVariance * 0.01 + state.stress * 0.2);
      const rayLength =
        baseRadius * (0.8 + Math.sin(state.time + i) * 0.12);
      const ex = cx + Math.cos(angle + sway) * rayLength;
      const ey = cy + Math.sin(angle + sway) * rayLength;

      if (rayLength > 20) {
        drawWordStem(ctx, cx, cy, ex, ey, colorStem, state);
      }

      ctx.save();
      ctx.strokeStyle = `${colorStem}40`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.restore();

      for (let n = 1; n <= nodeCount; n++) {
        const t = n / (nodeCount + 1);
        const nx = cx + (ex - cx) * t;
        const ny = cy + (ey - cy) * t;

        let nodePulse = 0;
        if (t < 0.33) {
          nodePulse = bassPulse;
        } else if (t < 0.66) {
          nodePulse = midPulse;
        } else {
          nodePulse = treblePulse;
        }
        const pulseScale = 1 + nodePulse * 0.6;

        const radius = (2 + t * 10 + state.energy * 6) * pulseScale;
        drawRadialNode(ctx, nx, ny, radius, colorNode, colorAccent, state);
      }

      const bloomRadius = (5 + trebleProgress * 25) * (1 + treblePulse * 0.5);
      if (rayLength > 10) {
        drawRadialNode(ctx, ex, ey, bloomRadius, colorAccent, colorStem, state);
      }
    }
  }

  const centerRadius = (10 + bassProgress * 30) * (1 + bassPulse * 0.4);
  drawRadialNode(ctx, cx, cy, centerRadius, colorAccent, colorStem, state);

  const haloWords = Math.min(state.descriptionWords.length, 48);
  if (haloWords && progress > 0.4) {
    const haloRadius = baseRadius * 0.6;
    for (let i = 0; i < haloWords; i++) {
      const word = state.descriptionWords[i];
      const angle = (Math.PI * 2 * i) / haloWords + state.time * 0.05;
      const px = cx + Math.cos(angle) * haloRadius;
      const py = cy + Math.sin(angle) * haloRadius;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle + Math.PI / 2);
      ctx.font = '10px "IBM Plex Mono", "Courier New", monospace';
      ctx.fillStyle = `${colorStem}aa`;
      ctx.fillText(word, 0, 0);
      ctx.restore();
    }
  }

  const satelliteCount = Math.floor(progress * 8);
  for (let i = 0; i < satelliteCount; i++) {
    const angle =
      (Math.PI * 2 * i) / 8 + state.time * 0.1;
    const dist = baseRadius * 1.15 + Math.sin(state.time + i) * 20;
    const sx = cx + Math.cos(angle) * dist;
    const sy = cy + Math.sin(angle) * dist;

    if (dist > 30) {
      drawRadialNode(
        ctx,
        sx,
        sy,
        8 + state.energy * 10,
        colorNode,
        colorAccent,
        state,
      );
      ctx.save();
      ctx.strokeStyle = `${colorStem}50`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.restore();

      const satellites = 3 + Math.floor(progress * 4);
      for (let s = 0; s < satellites; s++) {
        const theta = angle + (Math.PI * 2 * s) / satellites;
        const localRadius = 20 + s * 8;
        const px = sx + Math.cos(theta) * localRadius;
        const py = sy + Math.sin(theta) * localRadius;
        drawRadialNode(ctx, px, py, 2 + s * 2, colorAccent, colorStem, state);
        ctx.save();
        ctx.strokeStyle = `${colorAccent}60`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}
