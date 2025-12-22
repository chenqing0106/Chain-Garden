import React, { useRef, useEffect, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { PlantDNA, AudioSource, LabState, BioState } from "../types";

interface PlantCanvasProps {
  analyzer: AudioSource | null;
  dna: PlantDNA;
  labState: LabState;
  onSnapshot: (dataUrl: string) => void;
  triggerSnapshot: boolean;
  onBioUpdate?: (state: BioState) => void;
}

const PlantCanvas: React.FC<PlantCanvasProps> = ({
  analyzer,
  dna,
  labState,
  onSnapshot,
  triggerSnapshot,
  onBioUpdate,
}) => {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const growthRef = useRef<number>(0);
  const windRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Physics State
  const stressRef = useRef<number>(0);
  const energyRef = useRef<number>(0);
  const lastVolRef = useRef<number>(0);

  // 频段分区生长进度 - 让不同频率控制不同部位
  const bassGrowthRef = useRef<number>(0);    // 低频 → 根部/主干 (depth 0-2)
  const midGrowthRef = useRef<number>(0);     // 中频 → 中间分支 (depth 2-4)
  const trebleGrowthRef = useRef<number>(0);  // 高频 → 末端/叶子 (depth 4+)
  
  // 实时脉冲效果 - 频率突然增强时的视觉反馈
  const bassPulseRef = useRef<number>(0);     // 低频脉冲强度
  const midPulseRef = useRef<number>(0);      // 中频脉冲强度
  const treblePulseRef = useRef<number>(0);   // 高频脉冲强度
  
  // 上一帧的频率值（用于检测变化）
  const lastBassRef = useRef<number>(0);
  const lastMidRef = useRef<number>(0);
  const lastTrebleRef = useRef<number>(0);

  // Mouse/Cursor State
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const descriptionWords = useMemo(() => {
    const base = `${dna.speciesName ?? ""} ${dna.description ?? ""}`;
    return base
      .replace(/[\r\n]+/g, " ")
      .split(/\s+/)
      .map((w) => w.trim())
      .filter(Boolean);
  }, [dna.description, dna.speciesName]);

  // ----------------------------------------------------------------------
  // POINTILLIST DRAWING ENGINE (STIPPLING)
  // ----------------------------------------------------------------------

  // 抽象艺术风格：使用画笔质感的线条，带有纹理和点状效果
  const drawStippledLine = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width: number,
    color: string,
  ) => {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(12, dist * 1.2);

    // 增强光标影响：计算到鼠标的距离
    const mouseInfluence = mouseRef.current.active
      ? Math.max(
          0,
          1 -
            Math.hypot(
              (x1 + x2) / 2 - mouseRef.current.x,
              (y1 + y2) / 2 - mouseRef.current.y,
            ) /
              150,
        )
      : 0;

    const pulse = 1 + energyRef.current * 0.6 + mouseInfluence * 0.5;
    const scatter = stressRef.current * 2 + mouseInfluence * 4;

    // 光标吸引：线条向鼠标方向轻微弯曲（限制影响范围）
    let adjustedX2 = x2;
    let adjustedY2 = y2;
    if (mouseInfluence > 0.2) {
      const dx = mouseRef.current.x - (x1 + x2) / 2;
      const dy = mouseRef.current.y - (y1 + y2) / 2;
      // 限制吸引强度，避免植物被拉出视野
      const attractStrength = mouseInfluence * 0.15;
      adjustedX2 = x2 + dx * attractStrength;
      adjustedY2 = y2 + dy * attractStrength;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = width * pulse;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // 画笔质感：变化的透明度和纹理
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

    // 添加点状纹理效果
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
  const drawStippledCurve = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    cpX: number,
    cpY: number,
    x2: number,
    y2: number,
    width: number,
    color: string,
  ) => {
    const distEstimate = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(60, distEstimate * 1.5);

    // 增强光标影响
    const mouseInfluence = mouseRef.current.active
      ? Math.max(
          0,
          1 -
            Math.hypot(cpX - mouseRef.current.x, cpY - mouseRef.current.y) /
              150,
        )
      : 0;

    const pulse = 1 + energyRef.current * 0.6 + mouseInfluence * 0.5;
    const scatter = stressRef.current * 1.5 + mouseInfluence * 3;

    // 光标吸引：控制点向鼠标方向轻微移动（限制影响范围）
    let adjustedCpX = cpX;
    let adjustedCpY = cpY;
    if (mouseInfluence > 0.2) {
      const dx = mouseRef.current.x - cpX;
      const dy = mouseRef.current.y - cpY;
      // 限制吸引强度，避免植物被拉出视野
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

    // 添加点状纹理效果
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
  const drawCellularCluster = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
    outlineColor: string,
  ) => {
    const cells = 8 + Math.floor(radius * 1.5);

    // 增强光标影响：吸引和排斥效果
    const mouseInfluence = mouseRef.current.active
      ? Math.max(
          0,
          1 - Math.hypot(x - mouseRef.current.x, y - mouseRef.current.y) / 120,
        )
      : 0;

    const pulse = 1 + energyRef.current * 0.4 + mouseInfluence * 0.6;

    // 光标吸引：簇向鼠标方向轻微移动（限制影响范围）
    let adjustedX = x;
    let adjustedY = y;
    if (mouseInfluence > 0.2) {
      const dx = mouseRef.current.x - x;
      const dy = mouseRef.current.y - y;
      // 限制吸引强度，避免植物被拉出视野
      const attractStrength = mouseInfluence * 0.15;
      adjustedX = x + dx * attractStrength;
      adjustedY = y + dy * attractStrength;
    }

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.65 + mouseInfluence * 0.35;

    for (let i = 0; i < cells; i++) {
      const r = radius * Math.sqrt(Math.random()) * pulse;
      const theta = Math.random() * 2 * Math.PI;

      // 增强光标影响：点状元素对鼠标更敏感
      const cellMouseInfluence = mouseRef.current.active
        ? Math.max(
            0,
            1 -
              Math.hypot(
                adjustedX + r * Math.cos(theta) - mouseRef.current.x,
                adjustedY + r * Math.sin(theta) - mouseRef.current.y,
              ) /
                100,
          )
        : 0;

      const cx =
        adjustedX +
        r * Math.cos(theta) +
        windRef.current * 3 +
        mouseInfluence * 15 * (Math.random() - 0.5) +
        cellMouseInfluence * 8 * (Math.random() - 0.5);
      const cy =
        adjustedY +
        r * Math.sin(theta) +
        mouseInfluence * 15 * (Math.random() - 0.5) +
        cellMouseInfluence * 8 * (Math.random() - 0.5);

      const size =
        (Math.random() * 2.8 + 1.2) * pulse * (1 + cellMouseInfluence * 0.3);

      // 添加画笔质感：使用渐变透明度
      ctx.globalAlpha =
        (0.5 + Math.random() * 0.3) * (1 + mouseInfluence * 0.4);
      ctx.beginPath();
      ctx.arc(cx, cy, size, 0, Math.PI * 2);
      ctx.fill();

      // 添加外圈纹理
      if (size > 2) {
        ctx.globalAlpha = 0.2 + mouseInfluence * 0.2;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
  };

  const drawSoftBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    // 艺术风格：浅色背景，类似图片的off-white背景
    ctx.fillStyle = "#faf9f6";
    ctx.fillRect(0, 0, width, height);

    // 添加轻微的纹理感，模拟画笔质感
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

  const drawWordStem = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
  ) => {
    const words = descriptionWords.length
      ? descriptionWords
      : [dna.speciesName];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const length = Math.hypot(dx, dy);
    const step = Math.max(24, length / Math.max(words.length, 6));
    const pulse = 1 + energyRef.current * 0.5;

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

  const drawRadialNode = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    fill: string,
    stroke: string,
  ) => {
    // 增强光标影响：节点大小、位置和形状
    const mouseInfluence = mouseRef.current.active
      ? Math.max(
          0,
          1 - Math.hypot(x - mouseRef.current.x, y - mouseRef.current.y) / 120,
        )
      : 0;

    const adjustedRadius = radius * (1 + mouseInfluence * 0.5);

    // 光标吸引：节点向鼠标方向轻微移动（限制影响范围）
    let offsetX = mouseInfluence * 5 * (Math.random() - 0.5);
    let offsetY = mouseInfluence * 5 * (Math.random() - 0.5);
    if (mouseInfluence > 0.3) {
      const dx = mouseRef.current.x - x;
      const dy = mouseRef.current.y - y;
      // 限制吸引强度，避免植物被拉出视野
      const attractStrength = mouseInfluence * 0.2;
      offsetX = dx * attractStrength;
      offsetY = dy * attractStrength;
    }

    // 艺术风格：使用点状纹理填充
    ctx.fillStyle = fill;
    ctx.globalAlpha = 0.55 + mouseInfluence * 0.35;

    // 主圆
    ctx.beginPath();
    ctx.arc(x + offsetX, y + offsetY, adjustedRadius, 0, Math.PI * 2);
    ctx.fill();

    // 添加内部点状纹理
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

    // 描边
    ctx.lineWidth = 1.5 + mouseInfluence * 0.5;
    ctx.strokeStyle = stroke;
    ctx.globalAlpha = 0.75 + mouseInfluence * 0.25;
    ctx.beginPath();
    ctx.arc(x + offsetX, y + offsetY, adjustedRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const drawCrystalNode = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    fill: string,
    stroke: string,
  ) => {
    // 8.3: crystal_cactus节点 - 锐利风格
    // 减少内部点状纹理（texturePoints减半）
    // 增加描边宽度（lineWidth * 1.5）
    // 降低透明度（globalAlpha增加0.2）

    // 光标影响：节点大小、位置和形状（保持与drawRadialNode一致）
    const mouseInfluence = mouseRef.current.active
      ? Math.max(
          0,
          1 - Math.hypot(x - mouseRef.current.x, y - mouseRef.current.y) / 120,
        )
      : 0;

    const adjustedRadius = radius * (1 + mouseInfluence * 0.5);

    // 光标吸引：节点向鼠标方向轻微移动（限制影响范围）
    let offsetX = mouseInfluence * 5 * (Math.random() - 0.5);
    let offsetY = mouseInfluence * 5 * (Math.random() - 0.5);
    if (mouseInfluence > 0.3) {
      const dx = mouseRef.current.x - x;
      const dy = mouseRef.current.y - y;
      const attractStrength = mouseInfluence * 0.2;
      offsetX = dx * attractStrength;
      offsetY = dy * attractStrength;
    }

    // 艺术风格：使用点状纹理填充，但透明度更高（更实心）
    ctx.fillStyle = fill;
    ctx.globalAlpha = 0.75 + mouseInfluence * 0.25; // 增加0.2透明度（从0.55提升到0.75）

    // 主圆
    ctx.beginPath();
    ctx.arc(x + offsetX, y + offsetY, adjustedRadius, 0, Math.PI * 2);
    ctx.fill();

    // 添加内部点状纹理 - 减半
    const texturePoints = Math.floor(adjustedRadius * 1); // 从adjustedRadius * 2减半到adjustedRadius * 1
    ctx.globalAlpha = 0.5 + mouseInfluence * 0.3; // 增加0.2透明度（从0.3提升到0.5）
    for (let i = 0; i < texturePoints; i++) {
      const r = adjustedRadius * Math.sqrt(Math.random()) * 0.7;
      const theta = Math.random() * 2 * Math.PI;
      const px = x + offsetX + r * Math.cos(theta);
      const py = y + offsetY + r * Math.sin(theta);
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 描边 - 增加宽度
    ctx.lineWidth = (1.5 + mouseInfluence * 0.5) * 1.5; // lineWidth * 1.5
    ctx.strokeStyle = stroke;
    ctx.globalAlpha = 0.95 + mouseInfluence * 0.05; // 增加0.2透明度（从0.75提升到0.95）
    ctx.beginPath();
    ctx.arc(x + offsetX, y + offsetY, adjustedRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const createSatelliteCluster = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    satelliteCount: number,
    orbitRadius: number,
    nodeRadius: number,
    fill: string,
    stroke: string,
  ) => {
    for (let i = 0; i < satelliteCount; i++) {
      const angle = (Math.PI * 2 * i) / satelliteCount;
      const sx = cx + Math.cos(angle) * orbitRadius;
      const sy = cy + Math.sin(angle) * orbitRadius;
      drawRadialNode(ctx, sx, sy, nodeRadius, fill, stroke);
    }
  };

  // ----------------------------------------------------------------------
  // ARCHITECTURES
  // ----------------------------------------------------------------------

  // 获取对应深度的生长进度和脉冲效果
  const getDepthGrowth = (depth: number, maxDepth: number) => {
    // depth 0-2: 低频控制 (根部/主干)
    // depth 2-4: 中频控制 (中间分支)
    // depth 4+: 高频控制 (末端/叶子)
    const bassZone = maxDepth * 0.3;  // 前30%由低频控制
    const midZone = maxDepth * 0.6;   // 30%-60%由中频控制
    
    if (depth <= bassZone) {
      return {
        growth: bassGrowthRef.current,
        pulse: bassPulseRef.current,
        zone: 'bass'
      };
    } else if (depth <= midZone) {
      return {
        growth: midGrowthRef.current,
        pulse: midPulseRef.current,
        zone: 'mid'
      };
    } else {
      return {
        growth: trebleGrowthRef.current,
        pulse: treblePulseRef.current,
        zone: 'treble'
      };
    }
  };

  const drawFractal = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    len: number,
    angle: number,
    depth: number,
    width: number,
    maxDepth: number,
  ) => {
    if (!ctx) return;

    // 获取当前深度对应的生长进度和脉冲
    const { growth: zoneGrowth, pulse: zonePulse, zone } = getDepthGrowth(depth, maxDepth);
    
    // 如果对应频段的生长进度不足，不绘制这一层
    const minGrowthForDepth = (depth / maxDepth) * 80; // 需要的最低生长进度
    if (zoneGrowth < minGrowthForDepth) return;

    // 颜色回退逻辑
    const colorStem = dna.colorPalette[0] ?? "#2d3436";
    const colorLeaf = dna.colorPalette[1] ?? "#5fb895";
    
    // 脉冲效果：当前频段的脉冲影响粗细和颜色
    const pulseScale = 1 + zonePulse * 0.5; // 脉冲时膨胀

    // 光标影响：计算鼠标对分支的影响
    const mouseInfluence = mouseRef.current.active
      ? Math.max(
          0,
          1 - Math.hypot(x - mouseRef.current.x, y - mouseRef.current.y) / 250,
        )
      : 0;

    // 检查是否为alien_shrub架构
    const isAlienShrub = dna.growthArchitecture === "alien_shrub";

    // 计算端点，添加光标吸引效果
    const rad = (angle * Math.PI) / 180;
    let x2 = x + Math.sin(rad) * len;
    let y2 = y - Math.cos(rad) * len;

    // 7.1: alien_shrub - 节点位置添加更大的随机偏移
    if (isAlienShrub) {
      const randomOffset = 15; // 更大的随机偏移
      x2 += (Math.random() - 0.5) * randomOffset;
      y2 += (Math.random() - 0.5) * randomOffset;
    }

    // 光标吸引：分支向光标方向轻微弯曲（限制影响范围）
    if (mouseInfluence > 0.1) {
      const dx = mouseRef.current.x - x;
      const dy = mouseRef.current.y - y;
      const attractAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const angleDiff = ((attractAngle - angle + 180) % 360) - 180;
      // 限制弯曲强度，避免植物被拉出视野
      const newAngle = angle + angleDiff * mouseInfluence * 0.15;
      const newRad = (newAngle * Math.PI) / 180;
      x2 = x + Math.sin(newRad) * len;
      y2 = y - Math.cos(newRad) * len;
    }

    // 绘制分支，应用脉冲效果
    const branchWidth = width * (0.8 + mouseInfluence * 0.2) * pulseScale;
    drawStippledLine(
      ctx,
      x,
      y,
      x2,
      y2,
      branchWidth,
      colorStem,
    );

    // Task 2.1: 在分支节点添加径向节点（fractal_tree）
    // 节点大小根据深度递减，并应用脉冲效果
    if (!isAlienShrub) {
      const baseNodeRadius = (maxDepth - depth) * 3 + 5;
      const nodeRadius = baseNodeRadius * pulseScale;
      drawRadialNode(ctx, x, y, nodeRadius, colorLeaf, colorStem);
    }

    // Task 2.2: 添加文字茎干装饰（fractal_tree）
    // 在depth <= 2的分支上调用drawWordStem
    // 从父节点到当前节点绘制文字路径
    if (!isAlienShrub && depth <= 2 && descriptionWords.length > 0) {
      drawWordStem(ctx, x, y, x2, y2, colorStem);
    }

    // 7.1 & 7.2 & 7.3: alien_shrub - 在分支节点添加不规则节点和多层卫星簇
    if (isAlienShrub && depth > 1) {
      // 7.1: 创建不规则节点分布 - 节点大小随机变化
      const nodeRadius = 4 + Math.random() * 6; // radius = 4 + Math.random() * 6
      const fillColor =
        depth % 2 === 0 ? dna.colorPalette[1] : dna.colorPalette[2];
      const strokeColor = dna.colorPalette[0];

      drawRadialNode(ctx, x2, y2, nodeRadius, fillColor, strokeColor);

      // 7.3: 添加多层卫星簇 - 在每个主节点周围添加2-4层卫星
      const satelliteLayers = 2 + Math.floor(Math.random() * 3); // 2-4层
      for (let layer = 0; layer < satelliteLayers; layer++) {
        const satelliteCount = 3 + Math.floor(Math.random() * 4); // 每层3-6个小节点
        const orbitRadius = nodeRadius + 10 + layer * 12; // 每层轨道半径递增
        const satelliteRadius = 2 + Math.random() * 2; // 小节点半径2-4

        createSatelliteCluster(
          ctx,
          x2,
          y2,
          satelliteCount,
          orbitRadius,
          satelliteRadius,
          dna.colorPalette[2] ?? "#f4c095",
          dna.colorPalette[0] ?? "#2d3436",
        );
      }
    }

    // 7.2: alien_shrub - 在分支上添加随机角度的文字装饰
    if (isAlienShrub && depth <= 3 && depth > 1) {
      // 添加随机旋转到文字方向
      const randomAngleOffset = (Math.random() - 0.5) * 30; // 随机偏移 ±15度
      const adjustedAngle = angle + randomAngleOffset;
      const adjustedRad = (adjustedAngle * Math.PI) / 180;

      // 计算调整后的端点用于文字装饰
      const wordX2 = x + Math.sin(adjustedRad) * len;
      const wordY2 = y - Math.cos(adjustedRad) * len;

      drawWordStem(ctx, x, y, wordX2, wordY2, dna.colorPalette[0]);
    }

    if (depth > 2 && (depth % 2 === 0 || depth === maxDepth)) {
      const leafSize = Math.max(2, 10 - depth);
      if (
        dna.growthArchitecture.includes("succulent") ||
        dna.growthArchitecture.includes("cactus")
      ) {
        drawCellularCluster(ctx, x2, y2, leafSize * 1.5, colorLeaf, colorStem);
      } else if (!isAlienShrub) {
        // Task 2.3: 创建簇状叶子末端（fractal_tree）
        // 替换当前的简单叶子绘制逻辑
        // 在叶子位置创建3-5个小节点（radius 2-4）围绕末端点
        const clusterCount = 3 + Math.floor(Math.random() * 3); // 3-5个节点
        const clusterRadius = leafSize * 1.2; // 簇的分布半径

        for (let i = 0; i < clusterCount; i++) {
          const clusterAngle =
            (Math.PI * 2 * i) / clusterCount + Math.random() * 0.5;
          const clusterDist = clusterRadius * (0.5 + Math.random() * 0.5);
          const clusterX = x2 + Math.cos(clusterAngle) * clusterDist;
          const clusterY = y2 + Math.sin(clusterAngle) * clusterDist;
          const clusterNodeRadius = 2 + Math.random() * 2; // radius 2-4

          drawRadialNode(
            ctx,
            clusterX,
            clusterY,
            clusterNodeRadius,
            colorLeaf,
            colorStem,
          );
        }
      } else {
        // alien_shrub保留原有的艺术风格叶子
        const leafAngle = rad + (Math.random() - 0.5) * 0.8;
        const leafEndX = x2 + Math.sin(leafAngle) * leafSize * 1.5;
        const leafEndY = y2 - Math.cos(leafAngle) * leafSize * 1.5;

        drawStippledLine(ctx, x2, y2, leafEndX, leafEndY, width / 3, colorLeaf);

        const leafMouseInfluence = mouseRef.current.active
          ? Math.max(
              0,
              1 -
                Math.hypot(
                  (x2 + leafEndX) / 2 - mouseRef.current.x,
                  (y2 + leafEndY) / 2 - mouseRef.current.y,
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
      // 使用分区生长进度计算当前长度
      const depthProgress = zoneGrowth / 100;
      const curLen = len * Math.min(depthProgress * 1.5, 1);

      if (curLen > 2) {
        // 脉冲效果影响角度抖动
        const pulseJitter = zonePulse * (Math.random() - 0.5) * 20;
        const stressJitter = (Math.random() - 0.5) * stressRef.current * 30;
        const spread = dna.angleVariance + stressJitter + pulseJitter;
        const sway =
          Math.sin(windRef.current + depth) * (4 + stressRef.current * 8);

        // 光标影响传播到子分支
        const childMouseInfluence = mouseRef.current.active
          ? Math.max(
              0,
              1 -
                Math.hypot(x2 - mouseRef.current.x, y2 - mouseRef.current.y) /
                  250,
            )
          : 0;
        const adjustedSway =
          sway + childMouseInfluence * 15 * (Math.random() - 0.5);

        drawFractal(
          ctx,
          x2,
          y2,
          curLen * 0.8,
          angle - spread + adjustedSway,
          depth + 1,
          branchWidth * 0.65,
          maxDepth,
        );
        drawFractal(
          ctx,
          x2,
          y2,
          curLen * 0.8,
          angle + spread + adjustedSway,
          depth + 1,
          branchWidth * 0.65,
          maxDepth,
        );
      }
    }
  };

  const drawOrganicVine = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    initialAngle: number = 0, // 初始生长角度
    curveBias: number = 0, // 曲线偏向（左或右）
    lengthMultiplier: number = 1, // 长度倍数
    spreadFactor: number = 1, // 伸展因子
    individualGrowth: number = 1, // 单独的生长进度（0-1）
  ) => {
    const maxSegments = 70; // 最大段数
    let cx = x,
      cy = y;
    let angle = initialAngle; // 使用初始角度而不是固定向上

    const segmentLen = 10 * lengthMultiplier; // 可变的每段长度
    
    // 分区计算：根据三个频段分别控制藤蔓的不同部分
    // 底部 (0-30%): 低频控制
    // 中间 (30-60%): 中频控制  
    // 顶端 (60-100%): 高频控制
    const bassSegments = Math.floor(maxSegments * 0.3 * (bassGrowthRef.current / 100) * individualGrowth);
    const midSegments = Math.floor(maxSegments * 0.3 * (midGrowthRef.current / 100) * individualGrowth);
    const trebleSegments = Math.floor(maxSegments * 0.4 * (trebleGrowthRef.current / 100) * individualGrowth);
    const totalSegments = bassSegments + midSegments + trebleSegments;

    // 记录起点用于文字茎干装饰
    const startX = x;
    const startY = y;

    for (let i = 0; i < totalSegments; i++) {
      // 确定当前段所属的频段区域和对应的脉冲
      let currentPulse = 0;
      if (i < bassSegments) {
        currentPulse = bassPulseRef.current;
      } else if (i < bassSegments + midSegments) {
        currentPulse = midPulseRef.current;
      } else {
        currentPulse = treblePulseRef.current;
      }
      // 光标影响：计算鼠标对当前段的影响
      const mouseInfluence = mouseRef.current.active
        ? Math.max(
            0,
            1 -
              Math.hypot(cx - mouseRef.current.x, cy - mouseRef.current.y) /
                200,
          )
        : 0;

      const sway =
        Math.sin(i * 0.3 + windRef.current) * 8 * spreadFactor +
        mouseInfluence * 8;
      const curve =
        Math.cos(i * 0.1) * (dna.angleVariance / 5) + curveBias * 0.05; // 添加曲线偏向

      // 光标吸引：向鼠标方向轻微弯曲（限制影响范围）
      if (mouseInfluence > 0.1) {
        const dx = mouseRef.current.x - cx;
        const dy = mouseRef.current.y - cy;
        const attractAngle = Math.atan2(dy, dx);
        // 限制弯曲强度，避免植物被拉出视野
        angle =
          angle * (1 - mouseInfluence * 0.1) +
          attractAngle * mouseInfluence * 0.1;
      }

      angle += (curve + sway * 0.1) * 0.1;

      // 使用角度计算下一个点，支持任意方向生长
      const nx = cx + Math.sin(angle) * segmentLen;
      const ny = cy + Math.cos(angle) * segmentLen; // 改为加号，配合initialAngle=π实现向下生长

      // Organic curve control points
      const cpX = (cx + nx) / 2 + sway;
      const cpY = (cy + ny) / 2;

      // 应用脉冲效果到线条粗细
      const pulseScale = 1 + currentPulse * 0.6;
      const stemWidth = Math.max(1.5, 5 - i * 0.08) * pulseScale;
      
      drawStippledCurve(
        ctx,
        cx,
        cy,
        cpX,
        cpY,
        nx,
        ny,
        stemWidth,
        dna.colorPalette[0],
      );

      // 沿藤蔓路径添加节点：应用脉冲效果
      const nodeInterval = 6;
      if (i % nodeInterval === 0 && i > 0) {
        const baseNodeRadius = 4 + (i / totalSegments) * 6;
        const nodeRadius = baseNodeRadius * pulseScale;
        const fillColor =
          Math.floor(i / nodeInterval) % 2 === 0
            ? dna.colorPalette[1]
            : dna.colorPalette[2];
        const strokeColor = dna.colorPalette[0];
        drawRadialNode(ctx, nx, ny, nodeRadius, fillColor, strokeColor);
      }

      // 在藤蔓的前半段添加文字茎干装饰
      // 从起点到当前段绘制
      const wordInterval = 12; // 每隔12个段添加一次文字装饰
      if (i % wordInterval === 0 && i > 0 && i < totalSegments / 2) {
        drawWordStem(ctx, startX, startY, nx, ny, dna.colorPalette[0]);
      }

      // Leaves - 应用脉冲效果到叶子
      if (i % 4 === 0) {
        const leafBaseAngle = timeRef.current + i;
        const leafCount = 2 + Math.floor(Math.random() * 2); // 2-3个小节点
        const leafOrbitRadius = 8 * pulseScale; // 脉冲时叶子扩展

        for (let l = 0; l < leafCount; l++) {
          const leafAngle = leafBaseAngle + (Math.PI * 2 * l) / leafCount;
          const lx = nx + Math.cos(leafAngle) * leafOrbitRadius;
          const ly = ny + Math.sin(leafAngle) * leafOrbitRadius;
          const leafRadius = 2 + Math.random(); // 半径2-3

          drawRadialNode(
            ctx,
            lx,
            ly,
            leafRadius,
            dna.colorPalette[1],
            dna.colorPalette[0],
          );
        }
      }

      cx = nx;
      cy = ny;
    }
  };

  const drawCellularSucculent = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
  ) => {
    // 分区生长：内层由低频控制，中层由中频控制，外层由高频控制
    const maxLayers = 10;
    const bassLayers = Math.floor(maxLayers * 0.3 * (bassGrowthRef.current / 100));
    const midLayers = Math.floor(maxLayers * 0.35 * (midGrowthRef.current / 100));
    const trebleLayers = Math.floor(maxLayers * 0.35 * (trebleGrowthRef.current / 100));
    const layers = bassLayers + midLayers + trebleLayers;

    // 检查是否为crystal_cactus架构
    const isCrystalCactus = dna.growthArchitecture === "crystal_cactus";

    for (let i = 0; i < layers; i++) {
      // 确定当前层对应的脉冲
      let currentPulse = 0;
      if (i < bassLayers) {
        currentPulse = bassPulseRef.current;
      } else if (i < bassLayers + midLayers) {
        currentPulse = midPulseRef.current;
      } else {
        currentPulse = treblePulseRef.current;
      }
      const pulseScale = 1 + currentPulse * 0.5;
      
      const radius = i * 20 * pulseScale; // 应用脉冲到半径
      const count = 6 + i * 3;

      for (let j = 0; j < count; j++) {
        // 8.1: crystal_cactus - 节点精确对齐径向线
        const theta = isCrystalCactus
          ? (j / count) * Math.PI * 2
          : (j / count) * Math.PI * 2 + windRef.current * 0.1;

        const px = x + Math.cos(theta) * radius;
        const py = y + Math.sin(theta) * radius;

        // 节点大小应用脉冲效果
        const baseNodeSize = (layers - i) * 2 + 4;
        const nodeSize = baseNodeSize * pulseScale;

        // 交替使用colorPalette[1]和colorPalette[2]
        const fillColor =
          i % 2 === 0 ? dna.colorPalette[1] : dna.colorPalette[2];
        const strokeColor = dna.colorPalette[0];

        // 8.3: crystal_cactus - 调整节点形状为锐利风格
        if (isCrystalCactus) {
          // 为crystal_cactus绘制锐利风格的节点
          drawCrystalNode(ctx, px, py, nodeSize, fillColor, strokeColor);
        } else {
          // radial_succulent使用普通节点
          drawRadialNode(ctx, px, py, nodeSize, fillColor, strokeColor);
        }

        // 8.2: crystal_cactus - 在射线上调用drawWordStem，文字严格对齐径向方向
        // 在每隔2-3个射线上调用drawWordStem，从中心点到外层节点绘制
        if (j % 3 === 0 && i === Math.floor(layers) - 1) {
          drawWordStem(ctx, x, y, px, py, dna.colorPalette[0]);
        }

        // 在最外层节点周围添加卫星簇（3-4个小节点，半径2-3）
        // crystal_cactus不添加卫星簇，保持几何纯净性
        if (i === Math.floor(layers) - 1 && !isCrystalCactus) {
          const satelliteCount = 3 + Math.floor(Math.random() * 2); // 3-4个卫星
          const satelliteRadius = 2 + Math.random(); // 半径2-3
          const orbitRadius = nodeSize + 8; // 卫星轨道半径
          createSatelliteCluster(
            ctx,
            px,
            py,
            satelliteCount,
            orbitRadius,
            satelliteRadius,
            dna.colorPalette[2],
            dna.colorPalette[0],
          );
        }
      }
    }
  };

  const drawWillow = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // 树干高度由低频控制
    const h = 180 * (bassGrowthRef.current / 100);
    const bassPulse = bassPulseRef.current;
    const trunkPulseScale = 1 + bassPulse * 0.4;

    // 光标影响树干
    const trunkMouseInfluence = mouseRef.current.active
      ? Math.max(
          0,
          1 -
            Math.hypot(x - mouseRef.current.x, y - h / 2 - mouseRef.current.y) /
              200,
        )
      : 0;
    const trunkOffset = trunkMouseInfluence * 15 * (Math.random() - 0.5);

    // Trunk - 应用低频脉冲
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
      dna.colorPalette[0],
    );

    const topY = y - h;

    // 5.3: 在树干曲线上调用drawWordStem，从底部到顶部绘制
    if (h > 0) {
      drawWordStem(ctx, x, y, x, topY, dna.colorPalette[0]);
    }

    // 5.1: 在树干顶部添加大节点
    if (h > 0) {
      const trunkTopRadius = (10 + Math.random() * 2) * trunkPulseScale;
      drawRadialNode(
        ctx,
        x,
        topY,
        trunkTopRadius,
        dna.colorPalette[1],
        dna.colorPalette[0],
      );
    }

    // 分支数量由中频控制
    const midPulse = midPulseRef.current;
    const midPulseScale = 1 + midPulse * 0.4;
    const branches = Math.floor(15 * (midGrowthRef.current / 100));

    for (let i = 0; i < branches; i++) {
      // Branch arch - 增加分支范围
      const bx = x + (Math.random() - 0.5) * 180;
      const by = topY + (Math.random() - 0.5) * 50;

      // 光标影响分支
      const branchMouseInfluence = mouseRef.current.active
        ? Math.max(
            0,
            1 -
              Math.hypot(bx - mouseRef.current.x, by - mouseRef.current.y) /
                180,
          )
        : 0;
      const branchOffsetX = branchMouseInfluence * 10 * (Math.random() - 0.5);
      const branchOffsetY = branchMouseInfluence * 10 * (Math.random() - 0.5);

      // 分支应用中频脉冲
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
        dna.colorPalette[0],
      );

      // 5.1: 在每个分支起点添加中等节点
      const branchNodeRadius = (6 + Math.random() * 2) * midPulseScale;
      drawRadialNode(
        ctx,
        bx,
        by,
        branchNodeRadius,
        dna.colorPalette[1],
        dna.colorPalette[0],
      );

      // 垂柳藤蔓由高频控制
      const treblePulse = treblePulseRef.current;
      const treblePulseScale = 1 + treblePulse * 0.5;
      const drop = 280 * (trebleGrowthRef.current / 100);
      let vx = bx,
        vy = by;
      const segs = Math.floor(25 * (trebleGrowthRef.current / 100) + 5); // 至少5段
      for (let s = 0; s < segs; s++) {
        const vineMouseInfluence = mouseRef.current.active
          ? Math.max(
              0,
              1 -
                Math.hypot(vx - mouseRef.current.x, vy - mouseRef.current.y) /
                  150,
            )
          : 0;
        const wave =
          Math.sin(s + timeRef.current * 4 + stressRef.current * 15) * 5 +
          vineMouseInfluence * 8;
        const nx = vx + wave;
        const ny = vy + drop / Math.max(segs, 1);
        const vineWidth = 1.2 * treblePulseScale;
        drawStippledLine(ctx, vx, vy, nx, ny, vineWidth, dna.colorPalette[1]);

        // 5.2: 节点应用高频脉冲
        const nodeInterval = 4;
        if (s % nodeInterval === 0 && s > 0) {
          const baseNodeRadius = Math.max(2, 5 - (s / segs) * 3);
          const nodeRadius = baseNodeRadius * treblePulseScale;
          drawRadialNode(
            ctx,
            nx,
            ny,
            nodeRadius,
            dna.colorPalette[1],
            dna.colorPalette[0],
          );
        }

        vx = nx;
        vy = ny;
      }
    }
  };

  const drawFernFrond = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    height: number,
    maxSegments: number,
  ) => {
    // 分区生长：主茎由低频控制，侧枝由中频控制，叶片由高频控制
    const bassGrowth = bassGrowthRef.current / 100;
    const midGrowth = midGrowthRef.current / 100;
    const trebleGrowth = trebleGrowthRef.current / 100;
    
    const bassPulse = bassPulseRef.current;
    const midPulse = midPulseRef.current;
    const treblePulse = treblePulseRef.current;
    
    const segments = Math.floor(maxSegments * bassGrowth);
    const segmentHeight = height / maxSegments;

    // 主茎垂直向上
    let currentX = x;
    let currentY = y;
    const startY = y; // 记录起点用于文字装饰
    
    // 主茎脉冲效果
    const stemPulseScale = 1 + bassPulse * 0.4;

    // 绘制主茎段
    for (let i = 0; i < segments; i++) {
      const nextY = currentY - segmentHeight;

      // 主茎应用低频脉冲
      const stemWidth = 4 * stemPulseScale;
      drawStippledLine(
        ctx,
        currentX,
        currentY,
        currentX,
        nextY,
        stemWidth,
        dna.colorPalette[0],
      );

      // 在主茎节点添加径向节点
      if (i > 0 && i % 2 === 0) {
        const mainStemNodeRadius = (6 + Math.random() * 2) * stemPulseScale;
        drawRadialNode(
          ctx,
          currentX,
          currentY,
          mainStemNodeRadius,
          dna.colorPalette[1],
          dna.colorPalette[0],
        );
      }

      // 侧枝由中频控制
      const shouldDrawBranch = i > 0 && i % 2 === 0 && midGrowth > (i / segments);
      if (shouldDrawBranch) {
        const branchPulseScale = 1 + midPulse * 0.5;
        const branchLength = (height / maxSegments) * (3 + Math.random() * 2) * branchPulseScale;
        const branchAngle = ((35 + Math.random() * 10) * Math.PI) / 180;

        // 左侧枝
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
          dna.colorPalette[0],
        );

        // 侧枝节点
        const sideBranchNodeRadius = (3 + Math.random() * 2) * branchPulseScale;
        drawRadialNode(
          ctx,
          leftBranchX,
          leftBranchY,
          sideBranchNodeRadius,
          dna.colorPalette[1],
          dna.colorPalette[0],
        );

        // 叶片由高频控制
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
            dna.colorPalette[2],
            dna.colorPalette[0],
          );
        }

        // 右侧枝
        const rightBranchX = currentX + Math.cos(branchAngle) * branchLength;
        const rightBranchY = currentY - Math.sin(branchAngle) * branchLength;
        drawStippledLine(
          ctx,
          currentX,
          currentY,
          rightBranchX,
          rightBranchY,
          branchWidth,
          dna.colorPalette[0],
        );

        // 侧枝节点
        drawRadialNode(
          ctx,
          rightBranchX,
          rightBranchY,
          sideBranchNodeRadius,
          dna.colorPalette[1],
          dna.colorPalette[0],
        );

        // 右侧叶片
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
            dna.colorPalette[2],
            dna.colorPalette[0],
          );
        }
      }

      currentY = nextY;
    }

    // 在主茎上添加文字装饰，从底部到顶端绘制
    if (segments > 0) {
      const topY = startY - segments * segmentHeight;
      drawWordStem(ctx, currentX, startY, currentX, topY, dna.colorPalette[0]);
    }
  };

  const drawDataBlossom = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    width: number,
    height: number,
  ) => {
    // 分区生长：内层由低频控制，中层由中频控制，外层由高频控制
    const bassProgress = bassGrowthRef.current / 100;
    const midProgress = midGrowthRef.current / 100;
    const trebleProgress = trebleGrowthRef.current / 100;

    const bassPulse = bassPulseRef.current;
    const midPulse = midPulseRef.current;
    const treblePulse = treblePulseRef.current;

    const avgProgress = (bassProgress + midProgress + trebleProgress) / 3;
    const progress = avgProgress;

    // 基础半径从 0 开始生长，移除固定的 +100 偏移
    const baseRadius = Math.min(width, height) * 0.5 * progress;

    // 射线数量随进度增加，最多到 branchingFactor 决定的值
    const maxSpokes = Math.max(20, Math.floor(dna.branchingFactor * 7));
    const spokes = Math.floor(maxSpokes * Math.min(1, progress * 2));

    // 节点数量也随进度增加，从 0 开始
    const nodeCount = Math.floor(progress * 15);

    const colorStem = dna.colorPalette[0];
    const colorNode = dna.colorPalette[1] ?? "#5fb895";
    const colorAccent = dna.colorPalette[2] ?? "#f4c095";

    // 只有有进度时才绘制射线
    if (progress > 0.01) {
      for (let i = 0; i < spokes; i++) {
        const angle = (Math.PI * 2 * i) / spokes;
        const sway =
          Math.sin(timeRef.current * 0.8 + i) *
          (dna.angleVariance * 0.01 + stressRef.current * 0.2);
        const rayLength =
          baseRadius * (0.8 + Math.sin(timeRef.current + i) * 0.12);
        const ex = cx + Math.cos(angle + sway) * rayLength;
        const ey = cy + Math.sin(angle + sway) * rayLength;

        // 射线长度足够时才绘制文字
        if (rayLength > 20) {
          drawWordStem(ctx, cx, cy, ex, ey, colorStem);
        }

        ctx.save();
        ctx.strokeStyle = `${colorStem}40`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.restore();

        // 节点根据位置使用不同频段的脉冲
        for (let n = 1; n <= nodeCount; n++) {
          const t = n / (nodeCount + 1);
          const nx = cx + (ex - cx) * t;
          const ny = cy + (ey - cy) * t;

          // 内层节点用低频脉冲，中层用中频，外层用高频
          let nodePulse = 0;
          if (t < 0.33) {
            nodePulse = bassPulse;
          } else if (t < 0.66) {
            nodePulse = midPulse;
          } else {
            nodePulse = treblePulse;
          }
          const pulseScale = 1 + nodePulse * 0.6;

          const radius = (2 + t * 10 + energyRef.current * 6) * pulseScale;
          drawRadialNode(ctx, nx, ny, radius, colorNode, colorAccent);
        }

        // 末端节点用高频脉冲
        const bloomRadius = (5 + trebleProgress * 25) * (1 + treblePulse * 0.5);
        if (rayLength > 10) {
          drawRadialNode(ctx, ex, ey, bloomRadius, colorAccent, colorStem);
        }
      }
    }

    // 中心节点始终存在，但大小随进度增长
    const centerRadius = (10 + bassProgress * 30) * (1 + bassPulse * 0.4);
    drawRadialNode(
      ctx,
      cx,
      cy,
      centerRadius,
      colorAccent,
      colorStem,
    );

    const haloWords = Math.min(descriptionWords.length, 48);
    if (haloWords && progress > 0.4) {
      const haloRadius = baseRadius * 0.6;
      for (let i = 0; i < haloWords; i++) {
        const word = descriptionWords[i];
        const angle = (Math.PI * 2 * i) / haloWords + timeRef.current * 0.05;
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

    // 卫星簇随进度逐渐出现
    const satelliteCount = Math.floor(progress * 8);
    for (let i = 0; i < satelliteCount; i++) {
      const angle =
        (Math.PI * 2 * i) / 8 + timeRef.current * 0.1;
      const dist = baseRadius * 1.15 + Math.sin(timeRef.current + i) * 20;
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle) * dist;
      
      if (dist > 30) {
        drawRadialNode(
          ctx,
          sx,
          sy,
          8 + energyRef.current * 10,
          colorNode,
          colorAccent,
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
          drawRadialNode(ctx, px, py, 2 + s * 2, colorAccent, colorStem);
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
  };

  const drawArchitecture = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    by: number,
    width: number,
    height: number,
  ) => {
    if (
      dna.growthArchitecture === "fractal_tree" ||
      dna.growthArchitecture === "alien_shrub"
    ) {
      // Task 2: 增加初始长度和深度，让树更伸展开来
      drawFractal(ctx, cx, by, 120, 0, 1, 14, 7);
    } else if (dna.growthArchitecture === "organic_vine") {
      // 动态生成藤蔓：随着生长进度增加，藤蔓数量增多
      const topY = height * 0.15; // 从顶部15%处开始
      const growth = growthRef.current / 100; // 0-1的生长进度

      // 根据生长进度决定藤蔓数量（最多9条）
      const maxVines = Math.min(9, Math.floor(growth * 12));

      // 预定义藤蔓配置：位置、角度、曲线偏向、长度、伸展度
      const vineConfigs = [
        { x: 0, angle: Math.PI, bias: 0, length: 1.5, spread: 1.8 }, // 中间主藤
        {
          x: -180,
          angle: Math.PI - Math.PI / 8,
          bias: -2,
          length: 1.3,
          spread: 2.2,
        }, // 左1
        {
          x: 200,
          angle: Math.PI + Math.PI / 7,
          bias: 2.5,
          length: 1.2,
          spread: 2.5,
        }, // 右1
        {
          x: -320,
          angle: Math.PI - Math.PI / 6,
          bias: -2.5,
          length: 1.1,
          spread: 2.0,
        }, // 左2
        {
          x: 350,
          angle: Math.PI + Math.PI / 6,
          bias: 3,
          length: 1.0,
          spread: 2.3,
        }, // 右2
        {
          x: -100,
          angle: Math.PI - Math.PI / 12,
          bias: -1,
          length: 0.9,
          spread: 1.6,
        }, // 左中
        {
          x: 120,
          angle: Math.PI + Math.PI / 10,
          bias: 1.5,
          length: 0.85,
          spread: 1.7,
        }, // 右中
        {
          x: -450,
          angle: Math.PI - Math.PI / 5,
          bias: -3,
          length: 0.8,
          spread: 1.9,
        }, // 左3
        {
          x: 480,
          angle: Math.PI + Math.PI / 5,
          bias: 3.5,
          length: 0.75,
          spread: 2.1,
        }, // 右3
      ];

      // 绘制藤蔓，先生长的更长
      for (let i = 0; i < maxVines; i++) {
        const config = vineConfigs[i];
        // 计算该藤蔓的生长进度：先生长的藤蔓有更多时间生长
        const vineAge = Math.max(0, growth - i / 12); // 每条藤蔓延迟出现
        const ageFactor = Math.min(1, vineAge * 1.5); // 年龄因子，影响长度

        // 只有当藤蔓开始生长时才绘制
        if (ageFactor > 0) {
          drawOrganicVine(
            ctx,
            cx + config.x,
            topY,
            config.angle,
            config.bias,
            config.length,
            config.spread,
            ageFactor, // 传入年龄因子作为独立生长进度
          );
        }
      }
    } else if (
      dna.growthArchitecture === "radial_succulent" ||
      dna.growthArchitecture === "crystal_cactus"
    ) {
      drawCellularSucculent(ctx, cx, cy);
    } else if (dna.growthArchitecture === "fern_frond") {
      // 使用新的drawFernFrond函数绘制蕨类叶
      const fernHeight = 200;
      const fernSegments = 20;

      // 绘制中央主蕨叶
      drawFernFrond(ctx, cx, by, fernHeight, fernSegments);

      // 绘制左侧蕨叶（稍短）
      drawFernFrond(ctx, cx - 80, by, fernHeight * 0.75, fernSegments * 0.75);

      // 绘制右侧蕨叶（稍短）
      drawFernFrond(ctx, cx + 80, by, fernHeight * 0.75, fernSegments * 0.75);
    } else if (dna.growthArchitecture === "weeping_willow") {
      drawWillow(ctx, cx, by);
    } else if (dna.growthArchitecture === "data_blossom") {
      drawDataBlossom(ctx, cx, cy, width, height);
    }
  };

  // ----------------------------------------------------------------------
  // PHYSICS & ANIMATION
  // ----------------------------------------------------------------------

  const updatePhysics = (audio: {
    bass: number;
    mid: number;
    treble: number;
  }) => {
    const { bass, mid, treble } = audio;
    const vol = (bass + mid + treble) / 3;

    // ========== 1. 频段分区生长 ==========
    // 每个频段独立驱动对应部位的生长
    // 阈值设为 20，让微小声音也能触发生长
    const growthSpeed = dna.growthSpeed * 0.6;
    
    // 低频驱动根部生长 (bass → depth 0-2)
    if (bass > 20) {
      const bassGrowthRate = (bass / 255) * growthSpeed * 1.2;
      bassGrowthRef.current = Math.min(100, bassGrowthRef.current + bassGrowthRate);
    }
    
    // 中频驱动中间层生长 (mid → depth 2-4)
    if (mid > 20) {
      const midGrowthRate = (mid / 255) * growthSpeed * 1.0;
      midGrowthRef.current = Math.min(100, midGrowthRef.current + midGrowthRate);
    }
    
    // 高频驱动末端生长 (treble → depth 4+)
    if (treble > 20) {
      const trebleGrowthRate = (treble / 255) * growthSpeed * 0.8;
      trebleGrowthRef.current = Math.min(100, trebleGrowthRef.current + trebleGrowthRate);
    }
    
    // 总生长进度 = 三个频段的加权平均（保持兼容性）
    growthRef.current = (bassGrowthRef.current * 0.4 + midGrowthRef.current * 0.35 + trebleGrowthRef.current * 0.25);

    // ========== 2. 实时脉冲效果 ==========
    // 检测频率突然增强，触发脉冲
    const bassDelta = bass - lastBassRef.current;
    const midDelta = mid - lastMidRef.current;
    const trebleDelta = treble - lastTrebleRef.current;
    
    // 脉冲触发阈值：变化量 > 30
    if (bassDelta > 30) {
      bassPulseRef.current = Math.min(1.0, bassDelta / 80);
    } else {
      bassPulseRef.current = Math.max(0, bassPulseRef.current - 0.08); // 脉冲衰减
    }
    
    if (midDelta > 25) {
      midPulseRef.current = Math.min(1.0, midDelta / 70);
    } else {
      midPulseRef.current = Math.max(0, midPulseRef.current - 0.08);
    }
    
    if (trebleDelta > 20) {
      treblePulseRef.current = Math.min(1.0, trebleDelta / 60);
    } else {
      treblePulseRef.current = Math.max(0, treblePulseRef.current - 0.1);
    }
    
    // 记录当前帧频率值
    lastBassRef.current = bass;
    lastMidRef.current = mid;
    lastTrebleRef.current = treble;

    // ========== 3. 原有的压力/能量逻辑 ==========
    if (vol > 150) {
      stressRef.current = Math.min(1.0, stressRef.current + 0.04);
    } else {
      stressRef.current = Math.max(0.0, stressRef.current - 0.02);
    }

    const delta = Math.abs(vol - lastVolRef.current);
    energyRef.current = Math.min(1.0, delta / 30);
    lastVolRef.current = vol;

    // 风效果受中频影响
    windRef.current += 0.02 + mid / 800;

    if (onBioUpdate)
      onBioUpdate({ stress: stressRef.current, energy: energyRef.current });
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSoftBackground(ctx, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (labState === "EMPTY") {
      // 重置所有生长进度
      growthRef.current = 0;
      bassGrowthRef.current = 0;
      midGrowthRef.current = 0;
      trebleGrowthRef.current = 0;
      bassPulseRef.current = 0;
      midPulseRef.current = 0;
      treblePulseRef.current = 0;
      stressRef.current = 0;
      ctx.fillStyle = "#00000040";
      ctx.font = "20px monospace";
      ctx.textAlign = "center";
      ctx.fillText("WAITING FOR BIO-SYNTHESIS...", cx, cy);

      // Idle animation
      drawCellularCluster(
        ctx,
        cx,
        cy,
        20 + Math.sin(Date.now() / 500) * 5,
        "#00000020",
        "#000000",
      );

      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    if (labState === "SYNTHESIZED") {
      const pulse = Math.sin(Date.now() / 300) * 5;
      // Draw Seed
      drawCellularCluster(
        ctx,
        cx,
        cy,
        30 + pulse,
        dna.colorPalette[1],
        dna.colorPalette[0],
      );

      ctx.fillStyle = "#00000080";
      ctx.font = "16px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`READY: ${dna.speciesName.toUpperCase()}`, cx, cy + 80);
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    // GROWING STATE
    let audio = { bass: 0, mid: 0, treble: 0 };
    if (analyzer) {
      audio = analyzer.getFrequencyData();
      updatePhysics(audio);

      const totalVol = (audio.bass + audio.mid + audio.treble) / 3;

      // ZERO THRESHOLD GROWTH
      // If there is any signal > 0.1 (basically anything), grow.
      if (totalVol > 0.1) {
        if (growthRef.current < 100) {
          // High Gain input means vol can be high, so we scale it down but ensure minimum
          const nutrientFactor = Math.max(0.2, totalVol / 100);
          growthRef.current += dna.growthSpeed * 0.4 * nutrientFactor;
        }
      }
      windRef.current += 0.02 + audio.mid / 1000;
    }

    timeRef.current += 0.02;
    const by = canvas.height * 0.7; // 调整藤蔓起始位置，从0.9改为0.7，让藤蔓更靠上

    // 单层绘制，无双层偏移效果
    // 移除缩放变换，避免位置偏移问题
    // 如果需要脉冲效果，可以在各个绘制函数内部实现

    // 直接绘制，光标影响已集成到各个绘制函数中
    drawArchitecture(ctx, cx, cy, by, canvas.width, canvas.height);

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [analyzer, dna, labState]);

  // Snapshot Logic
  useEffect(() => {
    if (triggerSnapshot && canvasRef.current) {
      const cvs = canvasRef.current;
      const tmp = document.createElement("canvas");
      tmp.width = cvs.width;
      tmp.height = cvs.height;
      const tCtx = tmp.getContext("2d");
      if (tCtx) {
        tCtx.fillStyle = "#fcfbf8";
        tCtx.fillRect(0, 0, tmp.width, tmp.height);
        tCtx.drawImage(cvs, 0, 0);
        tCtx.font = "20px monospace";
        tCtx.fillStyle = "#000";
        tCtx.fillText(`${dna.speciesName.toUpperCase()}`, 20, 40);
        onSnapshot(tmp.toDataURL("image/png"));
      }
    }
  }, [triggerSnapshot]);

  // Resize Listener
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
        canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
      }
    };
    window.addEventListener("resize", resize);
    resize();
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Mouse/Cursor Tracking
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      className="w-full h-full relative overflow-hidden bg-transparent"
      data-oid="oh2p:5w"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full mix-blend-multiply"
        data-oid="glz.ghz"
      />

      {labState === "GROWING" && (
        <div
          className="absolute top-4 left-4 font-mono text-[10px] bg-white/90 p-2 border border-black pointer-events-none z-10 shadow-sm uppercase"
          data-oid="u6v1.kt"
        >
          <div data-oid="inw223v">
            {t("canvas_stress")}: {(stressRef.current * 100).toFixed(0)}%
          </div>
          <div className="w-24 h-1 bg-gray-200 mt-1" data-oid="-1vqsk3">
            <div
              className="h-full bg-riso-pink transition-all duration-75"
              style={{ width: `${stressRef.current * 100}%` }}
              data-oid="f32j7xj"
            ></div>
          </div>
          <div className="mt-2" data-oid="s0zn5iy">
            {t("canvas_energy")}: {(energyRef.current * 100).toFixed(0)}%
          </div>
          <div className="text-gray-400 mt-1 uppercase" data-oid="fc_ey1c">
            {analyzer ? t("canvas_linked") : t("canvas_no_signal")}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantCanvas;
