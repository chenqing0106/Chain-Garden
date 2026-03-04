import { DrawState } from "./types";

// 抽象艺术风格：使用画笔质感的线条，带有纹理和点状效果
export const drawStippledLine = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  color: string,
  state: DrawState,
) => {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(12, dist * 1.2);

  const mouseInfluence = state.mouse.active
    ? Math.max(
        0,
        1 -
          Math.hypot(
            (x1 + x2) / 2 - state.mouse.x,
            (y1 + y2) / 2 - state.mouse.y,
          ) /
            150,
      )
    : 0;

  const pulse = 1 + state.energy * 0.6 + mouseInfluence * 0.5;
  const scatter = state.stress * 2 + mouseInfluence * 4;

  let adjustedX2 = x2;
  let adjustedY2 = y2;
  if (mouseInfluence > 0.2) {
    const dx = state.mouse.x - (x1 + x2) / 2;
    const dy = state.mouse.y - (y1 + y2) / 2;
    const attractStrength = mouseInfluence * 0.15;
    adjustedX2 = x2 + dx * attractStrength;
    adjustedY2 = y2 + dy * attractStrength;
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = width * pulse;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = 0.75 + mouseInfluence * 0.25;

  ctx.beginPath();
  ctx.moveTo(x1, y1);

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const jitterX = (Math.random() - 0.5) * scatter * (1 - t * 0.4);
    const jitterY = (Math.random() - 0.5) * scatter * (1 - t * 0.4);
    const px = x1 + (adjustedX2 - x1) * t + jitterX;
    const py = y1 + (adjustedY2 - y1) * t + jitterY;
    ctx.lineTo(px, py);
  }

  ctx.stroke();

  if (width > 2) {
    ctx.globalAlpha = 0.4 + mouseInfluence * 0.3;
    for (let i = 0; i <= steps; i += 3) {
      const t = i / steps;
      const px = x1 + (adjustedX2 - x1) * t;
      const py = y1 + (adjustedY2 - y1) * t;
      ctx.beginPath();
      ctx.arc(px, py, width * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
};

// 抽象艺术风格：使用画笔质感的曲线，带有纹理效果
export const drawStippledCurve = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  cpX: number,
  cpY: number,
  x2: number,
  y2: number,
  width: number,
  color: string,
  state: DrawState,
) => {
  const distEstimate = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(60, distEstimate * 1.5);

  const mouseInfluence = state.mouse.active
    ? Math.max(
        0,
        1 -
          Math.hypot(cpX - state.mouse.x, cpY - state.mouse.y) /
            150,
      )
    : 0;

  const pulse = 1 + state.energy * 0.6 + mouseInfluence * 0.5;
  const scatter = state.stress * 1.5 + mouseInfluence * 3;

  let adjustedCpX = cpX;
  let adjustedCpY = cpY;
  if (mouseInfluence > 0.2) {
    const dx = state.mouse.x - cpX;
    const dy = state.mouse.y - cpY;
    const attractStrength = mouseInfluence * 0.2;
    adjustedCpX = cpX + dx * attractStrength;
    adjustedCpY = cpY + dy * attractStrength;
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = width * pulse;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = 0.75 + mouseInfluence * 0.25;

  ctx.beginPath();
  ctx.moveTo(x1, y1);

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const invT = 1 - t;
    const px = invT * invT * x1 + 2 * invT * t * adjustedCpX + t * t * x2;
    const py = invT * invT * y1 + 2 * invT * t * adjustedCpY + t * t * y2;
    const jitterX = (Math.random() - 0.5) * scatter * (1 - t * 0.3);
    const jitterY = (Math.random() - 0.5) * scatter * (1 - t * 0.3);
    ctx.lineTo(px + jitterX, py + jitterY);
  }

  ctx.stroke();

  if (width > 2) {
    ctx.globalAlpha = 0.4 + mouseInfluence * 0.3;
    for (let i = 0; i <= steps; i += 4) {
      const t = i / steps;
      const invT = 1 - t;
      const px = invT * invT * x1 + 2 * invT * t * adjustedCpX + t * t * x2;
      const py = invT * invT * y1 + 2 * invT * t * adjustedCpY + t * t * y2;
      ctx.beginPath();
      ctx.arc(px, py, width * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
};

// 抽象艺术风格：使用点状纹理的簇，带有画笔质感
export const drawCellularCluster = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  outlineColor: string,
  state: DrawState,
) => {
  const cells = 8 + Math.floor(radius * 1.5);

  const mouseInfluence = state.mouse.active
    ? Math.max(
        0,
        1 - Math.hypot(x - state.mouse.x, y - state.mouse.y) / 120,
      )
    : 0;

  const pulse = 1 + state.energy * 0.4 + mouseInfluence * 0.6;

  let adjustedX = x;
  let adjustedY = y;
  if (mouseInfluence > 0.2) {
    const dx = state.mouse.x - x;
    const dy = state.mouse.y - y;
    const attractStrength = mouseInfluence * 0.15;
    adjustedX = x + dx * attractStrength;
    adjustedY = y + dy * attractStrength;
  }

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.65 + mouseInfluence * 0.35;

  for (let i = 0; i < cells; i++) {
    const r = radius * Math.sqrt(Math.random()) * pulse;
    const theta = Math.random() * 2 * Math.PI;

    const cellMouseInfluence = state.mouse.active
      ? Math.max(
          0,
          1 -
            Math.hypot(
              adjustedX + r * Math.cos(theta) - state.mouse.x,
              adjustedY + r * Math.sin(theta) - state.mouse.y,
            ) /
              100,
        )
      : 0;

    const cx =
      adjustedX +
      r * Math.cos(theta) +
      state.wind * 3 +
      mouseInfluence * 15 * (Math.random() - 0.5) +
      cellMouseInfluence * 8 * (Math.random() - 0.5);
    const cy =
      adjustedY +
      r * Math.sin(theta) +
      mouseInfluence * 15 * (Math.random() - 0.5) +
      cellMouseInfluence * 8 * (Math.random() - 0.5);

    const size =
      (Math.random() * 2.8 + 1.2) * pulse * (1 + cellMouseInfluence * 0.3);

    ctx.globalAlpha =
      (0.5 + Math.random() * 0.3) * (1 + mouseInfluence * 0.4);
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.fill();

    if (size > 2) {
      ctx.globalAlpha = 0.2 + mouseInfluence * 0.2;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
};

export const drawSoftBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) => {
  ctx.fillStyle = "#faf9f6";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = "#000000";
  const speckles = 80;
  for (let i = 0; i < speckles; i++) {
    const size = Math.random() * 1.5 + 0.5;
    ctx.beginPath();
    ctx.arc(
      Math.random() * width,
      Math.random() * height,
      size,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
};

export const drawWordStem = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  state: DrawState,
) => {
  const words = state.descriptionWords.length
    ? state.descriptionWords
    : [state.speciesName];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const length = Math.hypot(dx, dy);
  const step = Math.max(24, length / Math.max(words.length, 6));
  const pulse = 1 + state.energy * 0.5;

  for (let dist = 0, idx = 0; dist <= length; dist += step, idx++) {
    const t = dist / length;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    const word = words[idx % words.length];

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    const fontSize = 10 + (1 - t) * 12 * pulse;
    ctx.font = `${fontSize}px "IBM Plex Mono", "Courier New", monospace`;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8 - t * 0.4;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8 * (1 - t);
    ctx.fillText(word, 0, 0);
    ctx.restore();
  }
};

export const drawRadialNode = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill: string,
  stroke: string,
  state: DrawState,
) => {
  const mouseInfluence = state.mouse.active
    ? Math.max(
        0,
        1 - Math.hypot(x - state.mouse.x, y - state.mouse.y) / 120,
      )
    : 0;

  const adjustedRadius = radius * (1 + mouseInfluence * 0.5);

  let offsetX = mouseInfluence * 5 * (Math.random() - 0.5);
  let offsetY = mouseInfluence * 5 * (Math.random() - 0.5);
  if (mouseInfluence > 0.3) {
    const dx = state.mouse.x - x;
    const dy = state.mouse.y - y;
    const attractStrength = mouseInfluence * 0.2;
    offsetX = dx * attractStrength;
    offsetY = dy * attractStrength;
  }

  ctx.fillStyle = fill;
  ctx.globalAlpha = 0.55 + mouseInfluence * 0.35;

  ctx.beginPath();
  ctx.arc(x + offsetX, y + offsetY, adjustedRadius, 0, Math.PI * 2);
  ctx.fill();

  const texturePoints = Math.floor(adjustedRadius * 2);
  ctx.globalAlpha = 0.3 + mouseInfluence * 0.3;
  for (let i = 0; i < texturePoints; i++) {
    const r = adjustedRadius * Math.sqrt(Math.random()) * 0.7;
    const theta = Math.random() * 2 * Math.PI;
    const px = x + offsetX + r * Math.cos(theta);
    const py = y + offsetY + r * Math.sin(theta);
    ctx.beginPath();
    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.lineWidth = 1.5 + mouseInfluence * 0.5;
  ctx.strokeStyle = stroke;
  ctx.globalAlpha = 0.75 + mouseInfluence * 0.25;
  ctx.beginPath();
  ctx.arc(x + offsetX, y + offsetY, adjustedRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
};

export const drawCrystalNode = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill: string,
  stroke: string,
  state: DrawState,
) => {
  const mouseInfluence = state.mouse.active
    ? Math.max(
        0,
        1 - Math.hypot(x - state.mouse.x, y - state.mouse.y) / 120,
      )
    : 0;

  const adjustedRadius = radius * (1 + mouseInfluence * 0.5);

  let offsetX = mouseInfluence * 5 * (Math.random() - 0.5);
  let offsetY = mouseInfluence * 5 * (Math.random() - 0.5);
  if (mouseInfluence > 0.3) {
    const dx = state.mouse.x - x;
    const dy = state.mouse.y - y;
    const attractStrength = mouseInfluence * 0.2;
    offsetX = dx * attractStrength;
    offsetY = dy * attractStrength;
  }

  ctx.fillStyle = fill;
  ctx.globalAlpha = 0.75 + mouseInfluence * 0.25;

  ctx.beginPath();
  ctx.arc(x + offsetX, y + offsetY, adjustedRadius, 0, Math.PI * 2);
  ctx.fill();

  const texturePoints = Math.floor(adjustedRadius * 1);
  ctx.globalAlpha = 0.5 + mouseInfluence * 0.3;
  for (let i = 0; i < texturePoints; i++) {
    const r = adjustedRadius * Math.sqrt(Math.random()) * 0.7;
    const theta = Math.random() * 2 * Math.PI;
    const px = x + offsetX + r * Math.cos(theta);
    const py = y + offsetY + r * Math.sin(theta);
    ctx.beginPath();
    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.lineWidth = (1.5 + mouseInfluence * 0.5) * 1.5;
  ctx.strokeStyle = stroke;
  ctx.globalAlpha = 0.95 + mouseInfluence * 0.05;
  ctx.beginPath();
  ctx.arc(x + offsetX, y + offsetY, adjustedRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
};

export const createSatelliteCluster = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  satelliteCount: number,
  orbitRadius: number,
  nodeRadius: number,
  fill: string,
  stroke: string,
  state: DrawState,
) => {
  for (let i = 0; i < satelliteCount; i++) {
    const angle = (Math.PI * 2 * i) / satelliteCount;
    const sx = cx + Math.cos(angle) * orbitRadius;
    const sy = cy + Math.sin(angle) * orbitRadius;
    drawRadialNode(ctx, sx, sy, nodeRadius, fill, stroke, state);
  }
};

// 获取对应深度的生长进度和脉冲效果
export const getDepthGrowth = (depth: number, maxDepth: number, state: DrawState) => {
  const bassZone = maxDepth * 0.3;
  const midZone = maxDepth * 0.6;

  if (depth <= bassZone) {
    return { growth: state.bass.growth, pulse: state.bass.pulse, zone: "bass" };
  } else if (depth <= midZone) {
    return { growth: state.mid.growth, pulse: state.mid.pulse, zone: "mid" };
  } else {
    return { growth: state.treble.growth, pulse: state.treble.pulse, zone: "treble" };
  }
};
