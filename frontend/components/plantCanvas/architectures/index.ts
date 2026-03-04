import { PlantDNA } from "../../../types";
import { DrawState } from "../types";
import { drawFractal } from "./fractal";
import { drawOrganicVine } from "./vine";
import { drawCellularSucculent } from "./succulent";
import { drawWillow } from "./willow";
import { drawFernFrond } from "./fern";
import { drawDataBlossom } from "./dataBlossom";

export function drawArchitecture(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  by: number,
  width: number,
  height: number,
  state: DrawState,
  dna: PlantDNA,
): void {
  if (
    dna.growthArchitecture === "fractal_tree" ||
    dna.growthArchitecture === "alien_shrub"
  ) {
    drawFractal(ctx, cx, by, 120, 0, 1, 14, 7, state, dna);
  } else if (dna.growthArchitecture === "organic_vine") {
    const topY = height * 0.15;
    const growth = state.growth / 100;

    const maxVines = Math.min(9, Math.floor(growth * 12));

    const vineConfigs = [
      { x: 0, angle: Math.PI, bias: 0, length: 1.5, spread: 1.8 },
      { x: -180, angle: Math.PI - Math.PI / 8, bias: -2, length: 1.3, spread: 2.2 },
      { x: 200, angle: Math.PI + Math.PI / 7, bias: 2.5, length: 1.2, spread: 2.5 },
      { x: -320, angle: Math.PI - Math.PI / 6, bias: -2.5, length: 1.1, spread: 2.0 },
      { x: 350, angle: Math.PI + Math.PI / 6, bias: 3, length: 1.0, spread: 2.3 },
      { x: -100, angle: Math.PI - Math.PI / 12, bias: -1, length: 0.9, spread: 1.6 },
      { x: 120, angle: Math.PI + Math.PI / 10, bias: 1.5, length: 0.85, spread: 1.7 },
      { x: -450, angle: Math.PI - Math.PI / 5, bias: -3, length: 0.8, spread: 1.9 },
      { x: 480, angle: Math.PI + Math.PI / 5, bias: 3.5, length: 0.75, spread: 2.1 },
    ];

    for (let i = 0; i < maxVines; i++) {
      const config = vineConfigs[i];
      const vineAge = Math.max(0, growth - i / 12);
      const ageFactor = Math.min(1, vineAge * 1.5);

      if (ageFactor > 0) {
        drawOrganicVine(
          ctx,
          cx + config.x,
          topY,
          state,
          dna,
          config.angle,
          config.bias,
          config.length,
          config.spread,
          ageFactor,
        );
      }
    }
  } else if (
    dna.growthArchitecture === "radial_succulent" ||
    dna.growthArchitecture === "crystal_cactus"
  ) {
    drawCellularSucculent(ctx, cx, cy, state, dna);
  } else if (dna.growthArchitecture === "fern_frond") {
    const fernHeight = 200;
    const fernSegments = 20;

    drawFernFrond(ctx, cx, by, fernHeight, fernSegments, state, dna);
    drawFernFrond(ctx, cx - 80, by, fernHeight * 0.75, fernSegments * 0.75, state, dna);
    drawFernFrond(ctx, cx + 80, by, fernHeight * 0.75, fernSegments * 0.75, state, dna);
  } else if (dna.growthArchitecture === "weeping_willow") {
    drawWillow(ctx, cx, by, state, dna);
  } else if (dna.growthArchitecture === "data_blossom") {
    drawDataBlossom(ctx, cx, cy, width, height, state, dna);
  }
}
