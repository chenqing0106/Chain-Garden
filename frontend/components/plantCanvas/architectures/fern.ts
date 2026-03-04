import { PlantDNA } from "../../../types";
import { DrawState } from "../types";
import { drawStippledLine, drawRadialNode, drawWordStem } from "../primitives";

export function drawFernFrond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  height: number,
  maxSegments: number,
  state: DrawState,
  dna: PlantDNA,
): void {
  const bassGrowth = state.bass.growth / 100;
  const midGrowth = state.mid.growth / 100;
  const trebleGrowth = state.treble.growth / 100;

  const bassPulse = state.bass.pulse;
  const midPulse = state.mid.pulse;
  const treblePulse = state.treble.pulse;

  const segments = Math.floor(maxSegments * bassGrowth);
  const segmentHeight = height / maxSegments;

  let currentX = x;
  let currentY = y;
  const startY = y;

  const stemPulseScale = 1 + bassPulse * 0.4;

  for (let i = 0; i < segments; i++) {
    const nextY = currentY - segmentHeight;

    const stemWidth = 4 * stemPulseScale;
    drawStippledLine(
      ctx,
      currentX,
      currentY,
      currentX,
      nextY,
      stemWidth,
      dna.colorPalette[0] ?? "#2d3436",
      state,
    );

    if (i > 0 && i % 2 === 0) {
      const mainStemNodeRadius = (6 + Math.random() * 2) * stemPulseScale;
      drawRadialNode(
        ctx,
        currentX,
        currentY,
        mainStemNodeRadius,
        dna.colorPalette[1] ?? "#5fb895",
        dna.colorPalette[0] ?? "#2d3436",
        state,
      );
    }

    const shouldDrawBranch = i > 0 && i % 2 === 0 && midGrowth > (i / segments);
    if (shouldDrawBranch) {
      const branchPulseScale = 1 + midPulse * 0.5;
      const branchLength = (height / maxSegments) * (3 + Math.random() * 2) * branchPulseScale;
      const branchAngle = ((35 + Math.random() * 10) * Math.PI) / 180;

      const leftBranchX = currentX - Math.cos(branchAngle) * branchLength;
      const leftBranchY = currentY - Math.sin(branchAngle) * branchLength;
      const branchWidth = 2.5 * branchPulseScale;
      drawStippledLine(
        ctx,
        currentX,
        currentY,
        leftBranchX,
        leftBranchY,
        branchWidth,
        dna.colorPalette[0] ?? "#2d3436",
        state,
      );

      const sideBranchNodeRadius = (3 + Math.random() * 2) * branchPulseScale;
      drawRadialNode(
        ctx,
        leftBranchX,
        leftBranchY,
        sideBranchNodeRadius,
        dna.colorPalette[1] ?? "#5fb895",
        dna.colorPalette[0] ?? "#2d3436",
        state,
      );

      const leafPulseScale = 1 + treblePulse * 0.6;
      const leafletCount = Math.floor((2 + Math.random() * 2) * trebleGrowth + 1);
      for (let l = 1; l <= leafletCount; l++) {
        const t = l / (leafletCount + 1);
        const leafletX = currentX - Math.cos(branchAngle) * branchLength * t;
        const leafletY = currentY - Math.sin(branchAngle) * branchLength * t;
        const leafletRadius = (1.5 + Math.random()) * leafPulseScale;
        drawRadialNode(
          ctx,
          leafletX,
          leafletY,
          leafletRadius,
          dna.colorPalette[2] ?? "#f4c095",
          dna.colorPalette[0] ?? "#2d3436",
          state,
        );
      }

      const rightBranchX = currentX + Math.cos(branchAngle) * branchLength;
      const rightBranchY = currentY - Math.sin(branchAngle) * branchLength;
      drawStippledLine(
        ctx,
        currentX,
        currentY,
        rightBranchX,
        rightBranchY,
        branchWidth,
        dna.colorPalette[0] ?? "#2d3436",
        state,
      );

      drawRadialNode(
        ctx,
        rightBranchX,
        rightBranchY,
        sideBranchNodeRadius,
        dna.colorPalette[1] ?? "#5fb895",
        dna.colorPalette[0] ?? "#2d3436",
        state,
      );

      for (let l = 1; l <= leafletCount; l++) {
        const t = l / (leafletCount + 1);
        const leafletX = currentX + Math.cos(branchAngle) * branchLength * t;
        const leafletY = currentY - Math.sin(branchAngle) * branchLength * t;
        const leafletRadius = (1.5 + Math.random()) * leafPulseScale;
        drawRadialNode(
          ctx,
          leafletX,
          leafletY,
          leafletRadius,
          dna.colorPalette[2] ?? "#f4c095",
          dna.colorPalette[0] ?? "#2d3436",
          state,
        );
      }
    }

    currentY = nextY;
  }

  if (segments > 0) {
    const topY = startY - segments * segmentHeight;
    drawWordStem(ctx, currentX, startY, currentX, topY, dna.colorPalette[0] ?? "#2d3436", state);
  }
}
