import { PlantDNA } from "../../../types";
import { DrawState } from "../types";
import {
  drawStippledLine,
  drawRadialNode,
  drawWordStem,
  drawCellularCluster,
  createSatelliteCluster,
  getDepthGrowth,
} from "../primitives";

export function drawFractal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  angle: number,
  depth: number,
  width: number,
  maxDepth: number,
  state: DrawState,
  dna: PlantDNA,
): void {
  if (!ctx) return;

  const { growth: zoneGrowth, pulse: zonePulse } = getDepthGrowth(depth, maxDepth, state);

  const minGrowthForDepth = (depth / maxDepth) * 80;
  if (zoneGrowth < minGrowthForDepth) return;

  const colorStem = dna.colorPalette[0] ?? "#2d3436";
  const colorLeaf = dna.colorPalette[1] ?? "#5fb895";

  const pulseScale = 1 + zonePulse * 0.5;

  const mouseInfluence = state.mouse.active
    ? Math.max(
        0,
        1 - Math.hypot(x - state.mouse.x, y - state.mouse.y) / 250,
      )
    : 0;

  const isAlienShrub = dna.growthArchitecture === "alien_shrub";

  const rad = (angle * Math.PI) / 180;
  let x2 = x + Math.sin(rad) * len;
  let y2 = y - Math.cos(rad) * len;

  if (isAlienShrub) {
    const randomOffset = 15;
    x2 += (Math.random() - 0.5) * randomOffset;
    y2 += (Math.random() - 0.5) * randomOffset;
  }

  if (mouseInfluence > 0.1) {
    const dx = state.mouse.x - x;
    const dy = state.mouse.y - y;
    const attractAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const angleDiff = ((attractAngle - angle + 180) % 360) - 180;
    const newAngle = angle + angleDiff * mouseInfluence * 0.15;
    const newRad = (newAngle * Math.PI) / 180;
    x2 = x + Math.sin(newRad) * len;
    y2 = y - Math.cos(newRad) * len;
  }

  const branchWidth = width * (0.8 + mouseInfluence * 0.2) * pulseScale;
  drawStippledLine(ctx, x, y, x2, y2, branchWidth, colorStem, state);

  if (!isAlienShrub) {
    const baseNodeRadius = (maxDepth - depth) * 3 + 5;
    const nodeRadius = baseNodeRadius * pulseScale;
    drawRadialNode(ctx, x, y, nodeRadius, colorLeaf, colorStem, state);
  }

  if (!isAlienShrub && depth <= 2 && state.descriptionWords.length > 0) {
    drawWordStem(ctx, x, y, x2, y2, colorStem, state);
  }

  if (isAlienShrub && depth > 1) {
    const nodeRadius = 4 + Math.random() * 6;
    const fillColor =
      depth % 2 === 0 ? dna.colorPalette[1] : dna.colorPalette[2];
    const strokeColor = dna.colorPalette[0];

    drawRadialNode(ctx, x2, y2, nodeRadius, fillColor ?? colorLeaf, strokeColor ?? colorStem, state);

    const satelliteLayers = 2 + Math.floor(Math.random() * 3);
    for (let layer = 0; layer < satelliteLayers; layer++) {
      const satelliteCount = 3 + Math.floor(Math.random() * 4);
      const orbitRadius = nodeRadius + 10 + layer * 12;
      const satelliteRadius = 2 + Math.random() * 2;

      createSatelliteCluster(
        ctx,
        x2,
        y2,
        satelliteCount,
        orbitRadius,
        satelliteRadius,
        dna.colorPalette[2] ?? "#f4c095",
        dna.colorPalette[0] ?? "#2d3436",
        state,
      );
    }
  }

  if (isAlienShrub && depth <= 3 && depth > 1) {
    const randomAngleOffset = (Math.random() - 0.5) * 30;
    const adjustedAngle = angle + randomAngleOffset;
    const adjustedRad = (adjustedAngle * Math.PI) / 180;
    const wordX2 = x + Math.sin(adjustedRad) * len;
    const wordY2 = y - Math.cos(adjustedRad) * len;
    drawWordStem(ctx, x, y, wordX2, wordY2, dna.colorPalette[0] ?? colorStem, state);
  }

  if (depth > 2 && (depth % 2 === 0 || depth === maxDepth)) {
    const leafSize = Math.max(2, 10 - depth);
    if (
      dna.growthArchitecture.includes("succulent") ||
      dna.growthArchitecture.includes("cactus")
    ) {
      drawCellularCluster(ctx, x2, y2, leafSize * 1.5, colorLeaf, colorStem, state);
    } else if (!isAlienShrub) {
      const clusterCount = 3 + Math.floor(Math.random() * 3);
      const clusterRadius = leafSize * 1.2;

      for (let i = 0; i < clusterCount; i++) {
        const clusterAngle =
          (Math.PI * 2 * i) / clusterCount + Math.random() * 0.5;
        const clusterDist = clusterRadius * (0.5 + Math.random() * 0.5);
        const clusterX = x2 + Math.cos(clusterAngle) * clusterDist;
        const clusterY = y2 + Math.sin(clusterAngle) * clusterDist;
        const clusterNodeRadius = 2 + Math.random() * 2;

        drawRadialNode(ctx, clusterX, clusterY, clusterNodeRadius, colorLeaf, colorStem, state);
      }
    } else {
      const leafAngle = rad + (Math.random() - 0.5) * 0.8;
      const leafEndX = x2 + Math.sin(leafAngle) * leafSize * 1.5;
      const leafEndY = y2 - Math.cos(leafAngle) * leafSize * 1.5;

      drawStippledLine(ctx, x2, y2, leafEndX, leafEndY, width / 3, colorLeaf, state);

      const leafMouseInfluence = state.mouse.active
        ? Math.max(
            0,
            1 -
              Math.hypot(
                (x2 + leafEndX) / 2 - state.mouse.x,
                (y2 + leafEndY) / 2 - state.mouse.y,
              ) /
                120,
          )
        : 0;

      if (leafSize > 3) {
        ctx.fillStyle = colorLeaf;
        ctx.globalAlpha = 0.4 + leafMouseInfluence * 0.3;
        for (let i = 0; i < 3; i++) {
          const t = 0.3 + i * 0.2;
          const px = x2 + (leafEndX - x2) * t;
          const py = y2 + (leafEndY - y2) * t;
          const offset = leafSize * 0.3;
          ctx.beginPath();
          ctx.arc(
            px + (Math.random() - 0.5) * offset,
            py + (Math.random() - 0.5) * offset,
            1.5,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
  }

  if (depth < maxDepth && len > 5) {
    const depthProgress = zoneGrowth / 100;
    const curLen = len * Math.min(depthProgress * 1.5, 1);

    if (curLen > 2) {
      const pulseJitter = zonePulse * (Math.random() - 0.5) * 20;
      const stressJitter = (Math.random() - 0.5) * state.stress * 30;
      const spread = dna.angleVariance + stressJitter + pulseJitter;
      const sway =
        Math.sin(state.wind + depth) * (4 + state.stress * 8);

      const childMouseInfluence = state.mouse.active
        ? Math.max(
            0,
            1 -
              Math.hypot(x2 - state.mouse.x, y2 - state.mouse.y) /
                250,
          )
        : 0;
      const adjustedSway =
        sway + childMouseInfluence * 15 * (Math.random() - 0.5);

      drawFractal(ctx, x2, y2, curLen * 0.8, angle - spread + adjustedSway, depth + 1, branchWidth * 0.65, maxDepth, state, dna);
      drawFractal(ctx, x2, y2, curLen * 0.8, angle + spread + adjustedSway, depth + 1, branchWidth * 0.65, maxDepth, state, dna);
    }
  }
}
