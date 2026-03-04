import { PlantDNA } from "../../../types";
import { DrawState } from "../types";
import { drawRadialNode, drawCrystalNode, createSatelliteCluster, drawWordStem } from "../primitives";

export function drawCellularSucculent(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  state: DrawState,
  dna: PlantDNA,
): void {
  const maxLayers = 10;
  const bassLayers = Math.floor(maxLayers * 0.3 * (state.bass.growth / 100));
  const midLayers = Math.floor(maxLayers * 0.35 * (state.mid.growth / 100));
  const trebleLayers = Math.floor(maxLayers * 0.35 * (state.treble.growth / 100));
  const layers = bassLayers + midLayers + trebleLayers;

  const isCrystalCactus = dna.growthArchitecture === "crystal_cactus";

  for (let i = 0; i < layers; i++) {
    let currentPulse = 0;
    if (i < bassLayers) {
      currentPulse = state.bass.pulse;
    } else if (i < bassLayers + midLayers) {
      currentPulse = state.mid.pulse;
    } else {
      currentPulse = state.treble.pulse;
    }
    const pulseScale = 1 + currentPulse * 0.5;

    const radius = i * 20 * pulseScale;
    const count = 6 + i * 3;

    for (let j = 0; j < count; j++) {
      const theta = isCrystalCactus
        ? (j / count) * Math.PI * 2
        : (j / count) * Math.PI * 2 + state.wind * 0.1;

      const px = x + Math.cos(theta) * radius;
      const py = y + Math.sin(theta) * radius;

      const baseNodeSize = (layers - i) * 2 + 4;
      const nodeSize = baseNodeSize * pulseScale;

      const fillColor =
        i % 2 === 0 ? dna.colorPalette[1] : dna.colorPalette[2];
      const strokeColor = dna.colorPalette[0];

      if (isCrystalCactus) {
        drawCrystalNode(ctx, px, py, nodeSize, fillColor ?? "#5fb895", strokeColor ?? "#2d3436", state);
      } else {
        drawRadialNode(ctx, px, py, nodeSize, fillColor ?? "#5fb895", strokeColor ?? "#2d3436", state);
      }

      if (j % 3 === 0 && i === Math.floor(layers) - 1) {
        drawWordStem(ctx, x, y, px, py, dna.colorPalette[0] ?? "#2d3436", state);
      }

      if (i === Math.floor(layers) - 1 && !isCrystalCactus) {
        const satelliteCount = 3 + Math.floor(Math.random() * 2);
        const satelliteRadius = 2 + Math.random();
        const orbitRadius = nodeSize + 8;
        createSatelliteCluster(
          ctx,
          px,
          py,
          satelliteCount,
          orbitRadius,
          satelliteRadius,
          dna.colorPalette[2] ?? "#f4c095",
          dna.colorPalette[0] ?? "#2d3436",
          state,
        );
      }
    }
  }
}
