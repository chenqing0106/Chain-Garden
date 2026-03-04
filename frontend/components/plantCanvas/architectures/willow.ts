import { PlantDNA } from "../../../types";
import { DrawState } from "../types";
import { drawStippledLine, drawStippledCurve, drawRadialNode, drawWordStem } from "../primitives";

export function drawWillow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  state: DrawState,
  dna: PlantDNA,
): void {
  const h = 180 * (state.bass.growth / 100);
  const bassPulse = state.bass.pulse;
  const trunkPulseScale = 1 + bassPulse * 0.4;

  const trunkMouseInfluence = state.mouse.active
    ? Math.max(
        0,
        1 -
          Math.hypot(x - state.mouse.x, y - h / 2 - state.mouse.y) /
            200,
      )
    : 0;
  const trunkOffset = trunkMouseInfluence * 15 * (Math.random() - 0.5);

  const trunkWidth = 12 * trunkPulseScale;
  drawStippledCurve(
    ctx,
    x,
    y,
    x + 20 + trunkOffset,
    y - h / 2,
    x,
    y - h,
    trunkWidth,
    dna.colorPalette[0] ?? "#2d3436",
    state,
  );

  const topY = y - h;

  if (h > 0) {
    drawWordStem(ctx, x, y, x, topY, dna.colorPalette[0] ?? "#2d3436", state);
  }

  if (h > 0) {
    const trunkTopRadius = (10 + Math.random() * 2) * trunkPulseScale;
    drawRadialNode(
      ctx,
      x,
      topY,
      trunkTopRadius,
      dna.colorPalette[1] ?? "#5fb895",
      dna.colorPalette[0] ?? "#2d3436",
      state,
    );
  }

  const midPulse = state.mid.pulse;
  const midPulseScale = 1 + midPulse * 0.4;
  const branches = Math.floor(15 * (state.mid.growth / 100));

  for (let i = 0; i < branches; i++) {
    const bx = x + (Math.random() - 0.5) * 180;
    const by = topY + (Math.random() - 0.5) * 50;

    const branchMouseInfluence = state.mouse.active
      ? Math.max(
          0,
          1 -
            Math.hypot(bx - state.mouse.x, by - state.mouse.y) /
              180,
        )
      : 0;
    const branchOffsetX = branchMouseInfluence * 10 * (Math.random() - 0.5);
    const branchOffsetY = branchMouseInfluence * 10 * (Math.random() - 0.5);

    const branchWidth = 2.5 * midPulseScale;
    drawStippledCurve(
      ctx,
      x,
      topY,
      x + branchOffsetX,
      topY - 20 + branchOffsetY,
      bx,
      by,
      branchWidth,
      dna.colorPalette[0] ?? "#2d3436",
      state,
    );

    const branchNodeRadius = (6 + Math.random() * 2) * midPulseScale;
    drawRadialNode(
      ctx,
      bx,
      by,
      branchNodeRadius,
      dna.colorPalette[1] ?? "#5fb895",
      dna.colorPalette[0] ?? "#2d3436",
      state,
    );

    const treblePulse = state.treble.pulse;
    const treblePulseScale = 1 + treblePulse * 0.5;
    const drop = 280 * (state.treble.growth / 100);
    let vx = bx,
      vy = by;
    const segs = Math.floor(25 * (state.treble.growth / 100) + 5);
    for (let s = 0; s < segs; s++) {
      const vineMouseInfluence = state.mouse.active
        ? Math.max(
            0,
            1 -
              Math.hypot(vx - state.mouse.x, vy - state.mouse.y) /
                150,
          )
        : 0;
      const wave =
        Math.sin(s + state.time * 4 + state.stress * 15) * 5 +
        vineMouseInfluence * 8;
      const nx = vx + wave;
      const ny = vy + drop / Math.max(segs, 1);
      const vineWidth = 1.2 * treblePulseScale;
      drawStippledLine(ctx, vx, vy, nx, ny, vineWidth, dna.colorPalette[1] ?? "#5fb895", state);

      const nodeInterval = 4;
      if (s % nodeInterval === 0 && s > 0) {
        const baseNodeRadius = Math.max(2, 5 - (s / segs) * 3);
        const nodeRadius = baseNodeRadius * treblePulseScale;
        drawRadialNode(
          ctx,
          nx,
          ny,
          nodeRadius,
          dna.colorPalette[1] ?? "#5fb895",
          dna.colorPalette[0] ?? "#2d3436",
          state,
        );
      }

      vx = nx;
      vy = ny;
    }
  }
}
