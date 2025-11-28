import React, { useRef, useEffect, useMemo } from 'react';
import { PlantDNA, AudioSource, LabState, BioState } from '../types';

interface PlantCanvasProps {
  analyzer: AudioSource | null;
  dna: PlantDNA;
  labState: LabState;
  onSnapshot: (dataUrl: string) => void;
  triggerSnapshot: boolean;
  onBioUpdate?: (state: BioState) => void;
}

const PlantCanvas: React.FC<PlantCanvasProps> = ({ analyzer, dna, labState, onSnapshot, triggerSnapshot, onBioUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const growthRef = useRef<number>(0); 
  const windRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Physics State
  const stressRef = useRef<number>(0); 
  const energyRef = useRef<number>(0); 
  const lastVolRef = useRef<number>(0);

  const descriptionWords = useMemo(() => {
      const base = `${dna.speciesName ?? ''} ${dna.description ?? ''}`;
      return base
          .replace(/[\r\n]+/g, ' ')
          .split(/\s+/)
          .map(w => w.trim())
          .filter(Boolean);
  }, [dna.description, dna.speciesName]);
  
  // ----------------------------------------------------------------------
  // POINTILLIST DRAWING ENGINE (STIPPLING)
  // ----------------------------------------------------------------------
  
  // Draws a line made of organic dots instead of a solid stroke
  const drawStippledLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number, color: string) => {
      const dist = Math.hypot(x2 - x1, y2 - y1);
      // DENSITY UPGRADE: 1.5 dots per pixel for solid ink bleed effect (Concrete Poetry style)
      const steps = Math.max(10, dist * 1.5); 
      
      // Reactivity: Dot size pulses with Energy (Breathing)
      const pulse = 1 + (energyRef.current * 1.5);
      // Reactivity: High stress causes dots to scatter (disintegrate)
      const scatter = stressRef.current * 5; 

      ctx.fillStyle = color;
      
      for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          
          // Organic Jitter (Ink spread)
          const jitterX = (Math.random() - 0.5) * (0.5 + scatter);
          const jitterY = (Math.random() - 0.5) * (0.5 + scatter);
          
          const px = x1 + (x2 - x1) * t + jitterX;
          const py = y1 + (y2 - y1) * t + jitterY;
          
          // Tapering width
          const currentWidth = width * (1 - t * 0.6); 
          
          // Breathing dots: Size varies with volume/energy
          // Base size + Pulse + Random Noise
          const size = Math.max(0.6, currentWidth * pulse * (0.5 + Math.random() * 0.5));
          
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
      }
  };

  // Draws a quadratic curve using dots
  const drawStippledCurve = (ctx: CanvasRenderingContext2D, x1: number, y1: number, cpX: number, cpY: number, x2: number, y2: number, width: number, color: string) => {
      const distEstimate = Math.hypot(x2-x1, y2-y1);
      // High resolution for smooth organic curves
      const steps = Math.max(100, distEstimate * 2); 
      
      const pulse = 1 + (energyRef.current * 1.5);
      const scatter = stressRef.current * 3;

      ctx.fillStyle = color;

      for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          // Quadratic Bezier Formula
          const invT = 1 - t;
          const px = (invT * invT * x1) + (2 * invT * t * cpX) + (t * t * x2);
          const py = (invT * invT * y1) + (2 * invT * t * cpY) + (t * t * y2);

          const jitter = (Math.random() - 0.5) * scatter;
          const currentWidth = width * (1 - t * 0.5);
          const size = Math.max(0.6, currentWidth * pulse * (0.5 + Math.random() * 0.5));

          ctx.beginPath();
          ctx.arc(px + jitter, py + jitter, size, 0, Math.PI * 2);
          ctx.fill();
      }
  };

  // Draws a "Cellular" cluster (for fruits/succulents)
  const drawCellularCluster = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, outlineColor: string) => {
      // Cell density proportional to area
      const cells = 8 + Math.floor(radius * 1.5); 
      const pulse = 1 + (energyRef.current * 0.4);

      for(let i=0; i<cells; i++) {
          // Random point inside circle (Cell packing)
          const r = radius * Math.sqrt(Math.random()) * pulse;
          const theta = Math.random() * 2 * Math.PI;
          
          // Add wind sway to individual cells
          const cx = x + r * Math.cos(theta) + (windRef.current * 5);
          const cy = y + r * Math.sin(theta);
          
          const size = (Math.random() * 3 + 1.5) * pulse;

          ctx.beginPath();
          ctx.arc(cx, cy, size, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          
          // Riso Offset Highlight
          if (Math.random() > 0.5) {
            ctx.beginPath();
            ctx.arc(cx - 1, cy - 1, size/2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fill();
          }
      }
  };

  const drawSoftBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const gradient = ctx.createRadialGradient(
          width * 0.3,
          height * 0.3,
          20,
          width * 0.7,
          height * 0.8,
          Math.max(width, height)
      );
      gradient.addColorStop(0, '#fff9e8');
      gradient.addColorStop(0.45, '#f6eed8');
      gradient.addColorStop(1, '#d9d2bd');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalAlpha = 0.04;
      ctx.fillStyle = '#000000';
      const speckles = 80;
      for (let i = 0; i < speckles; i++) {
          const size = Math.random() * 3;
          ctx.fillRect(Math.random() * width, Math.random() * height, size, size);
      }
      ctx.restore();
  };

  const drawWordStem = (
      ctx: CanvasRenderingContext2D,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color: string
  ) => {
      const words = descriptionWords.length ? descriptionWords : [dna.speciesName];
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
      stroke: string
  ) => {
      const gradient = ctx.createRadialGradient(x - radius / 3, y - radius / 3, radius * 0.2, x, y, radius);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(1, fill);
      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = stroke;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
  };

  // ----------------------------------------------------------------------
  // ARCHITECTURES
  // ----------------------------------------------------------------------

  const drawFractal = (ctx: CanvasRenderingContext2D, x: number, y: number, len: number, angle: number, depth: number, width: number, maxDepth: number) => {
      // Calculate end point
      const rad = angle * Math.PI / 180;
      const x2 = x + Math.sin(rad) * len; 
      const y2 = y - Math.cos(rad) * len;

      // Draw Stippled Branch
      drawStippledLine(ctx, x, y, x2, y2, width, dna.colorPalette[0]);

      if (depth > 2 && (depth % 2 === 0 || depth === maxDepth)) {
          // Draw Leaves/Fruit at nodes
          const leafSize = Math.max(3, (12 - depth));
          if (dna.growthArchitecture.includes('succulent') || dna.growthArchitecture.includes('cactus')) {
             drawCellularCluster(ctx, x2, y2, leafSize * 2, dna.colorPalette[1], dna.colorPalette[0]);
          } else {
             // Simple stippled leaf
             drawStippledLine(ctx, x2, y2, x2 + Math.sin(rad + 0.5) * leafSize*2, y2 - Math.cos(rad + 0.5) * leafSize*2, width/2, dna.colorPalette[1]);
          }
      }

      if (depth < maxDepth && len > 5) {
          const growth = Math.min(growthRef.current / (10 * depth + 1), 1);
          const curLen = len * growth;
          
          if (curLen > 2) {
              const stressJitter = (Math.random() - 0.5) * stressRef.current * 40;
              const spread = dna.angleVariance + stressJitter;
              const sway = Math.sin(windRef.current + depth) * (5 + stressRef.current * 10);
              
              drawFractal(ctx, x2, y2, curLen * 0.8, angle - spread + sway, depth + 1, width * 0.7, maxDepth);
              drawFractal(ctx, x2, y2, curLen * 0.8, angle + spread + sway, depth + 1, width * 0.7, maxDepth);
          }
      }
  };

  const drawOrganicVine = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      const segments = 50;
      let cx = x, cy = y;
      let angle = 0; // Upwards
      
      const segmentLen = 8;
      const totalSegments = segments * (growthRef.current / 100);

      for(let i=0; i < totalSegments; i++) {
          const sway = Math.sin(i * 0.3 + windRef.current) * 10;
          const curve = Math.cos(i * 0.1) * (dna.angleVariance / 5);
          
          angle += (curve + sway * 0.1) * 0.1;
          
          const nx = cx + Math.sin(angle) * segmentLen;
          const ny = cy - Math.cos(angle) * segmentLen;
          
          // Organic curve control points
          const cpX = (cx + nx) / 2 + sway;
          const cpY = (cy + ny) / 2;

          drawStippledCurve(ctx, cx, cy, cpX, cpY, nx, ny, Math.max(1, 6 - i*0.1), dna.colorPalette[0]);

          // Leaves
          if (i % 3 === 0) {
              const lx = nx + Math.cos(timeRef.current + i) * 15;
              const ly = ny + Math.sin(timeRef.current + i) * 10;
              drawStippledLine(ctx, nx, ny, lx, ly, 2, dna.colorPalette[1]);
          }

          cx = nx; cy = ny;
      }
  };

  const drawCellularSucculent = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      const layers = 8 * (growthRef.current / 100);
      
      for(let i=0; i < layers; i++) {
          const radius = i * 12; // Wider spread
          const count = 6 + i * 3;
          
          for(let j=0; j < count; j++) {
              const theta = (j / count) * Math.PI * 2 + windRef.current * 0.1;
              const px = x + Math.cos(theta) * radius;
              const py = y + Math.sin(theta) * radius;
              
              const size = (14 - i) * (1 + energyRef.current * 0.3);
              
              drawCellularCluster(ctx, px, py, size, i % 2 === 0 ? dna.colorPalette[1] : dna.colorPalette[2], dna.colorPalette[0]);
          }
      }
  };

  const drawWillow = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      const h = 100 * (growthRef.current/100);
      // Trunk
      drawStippledCurve(ctx, x, y, x + 20, y - h/2, x, y - h, 14, dna.colorPalette[0]);
      
      const topY = y - h;
      const branches = 12;
      
      for(let i=0; i<branches; i++) {
          // Branch arch
          const bx = x + (Math.random()-0.5) * 100;
          const by = topY + (Math.random()-0.5) * 30;
          drawStippledCurve(ctx, x, topY, x, topY-20, bx, by, 3, dna.colorPalette[0]);
          
          // Hanging Vine
          const drop = 160 * (growthRef.current/100);
          let vx = bx, vy = by;
          const segs = 20;
          for(let s=0; s<segs; s++) {
               const wave = Math.sin(s + timeRef.current * 4 + stressRef.current * 15) * 6;
               const nx = vx + wave;
               const ny = vy + (drop/segs);
               // Very light stippling for willow threads
               drawStippledLine(ctx, vx, vy, nx, ny, 1.5, dna.colorPalette[1]);
               vx = nx; vy = ny;
          }
      }
  };

  const drawDataBlossom = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      width: number,
      height: number
  ) => {
      const progress = Math.max(0.18, growthRef.current / 100);
      const baseRadius = Math.min(width, height) * 0.35 * progress + 80;
      const spokes = Math.max(18, Math.floor(dna.branchingFactor * 6));
      const nodeCount = 4 + Math.floor(progress * 10);
      const colorStem = dna.colorPalette[0];
      const colorNode = dna.colorPalette[1] ?? '#5fb895';
      const colorAccent = dna.colorPalette[2] ?? '#f4c095';

      for (let i = 0; i < spokes; i++) {
          const angle = (Math.PI * 2 * i) / spokes;
          const sway = Math.sin(timeRef.current * 0.8 + i) * (dna.angleVariance * 0.01 + stressRef.current * 0.2);
          const rayLength = baseRadius * (0.8 + Math.sin(timeRef.current + i) * 0.12);
          const ex = cx + Math.cos(angle + sway) * rayLength;
          const ey = cy + Math.sin(angle + sway) * rayLength;

          drawWordStem(ctx, cx, cy, ex, ey, colorStem);

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
              const radius = 4 + t * 10 + energyRef.current * 6;
              drawRadialNode(ctx, nx, ny, radius, colorNode, colorAccent);
          }

          const bloomRadius = 10 + growthRef.current * 0.2;
          drawRadialNode(ctx, ex, ey, bloomRadius, colorAccent, colorStem);
      }

      drawRadialNode(ctx, cx, cy, 18 + growthRef.current * 0.2, colorAccent, colorStem);

      const haloWords = Math.min(descriptionWords.length, 48);
      if (haloWords) {
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

      const satelliteClusters = 6;
      for (let i = 0; i < satelliteClusters; i++) {
          const angle = (Math.PI * 2 * i) / satelliteClusters + timeRef.current * 0.1;
          const dist = baseRadius * 1.15 + Math.sin(timeRef.current + i) * 20;
          const sx = cx + Math.cos(angle) * dist;
          const sy = cy + Math.sin(angle) * dist;
          drawRadialNode(ctx, sx, sy, 12 + energyRef.current * 8, colorNode, colorAccent);
          ctx.save();
          ctx.strokeStyle = `${colorStem}50`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(sx, sy);
          ctx.stroke();
          ctx.restore();

          const satellites = 5;
          for (let s = 0; s < satellites; s++) {
              const theta = angle + (Math.PI * 2 * s) / satellites;
              const localRadius = 30 + s * 8;
              const px = sx + Math.cos(theta) * localRadius;
              const py = sy + Math.sin(theta) * localRadius;
              drawRadialNode(ctx, px, py, 4 + s * 2, colorAccent, colorStem);
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
  };

  const drawArchitecture = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      by: number,
      width: number,
      height: number
  ) => {
      if (dna.growthArchitecture === 'fractal_tree' || dna.growthArchitecture === 'alien_shrub') {
          drawFractal(ctx, cx, by, 80, 0, 1, 14, 6);
      } else if (dna.growthArchitecture === 'organic_vine') {
          drawOrganicVine(ctx, cx, by);
          drawOrganicVine(ctx, cx-60, by);
          drawOrganicVine(ctx, cx+60, by);
      } else if (dna.growthArchitecture === 'radial_succulent' || dna.growthArchitecture === 'crystal_cactus') {
          drawCellularSucculent(ctx, cx, cy);
      } else if (dna.growthArchitecture === 'fern_frond') {
          drawFractal(ctx, cx, by, 100, 0, 1, 12, 5);
          drawFractal(ctx, cx-40, by, 80, -30, 1, 10, 4);
          drawFractal(ctx, cx+40, by, 80, 30, 1, 10, 4);
      } else if (dna.growthArchitecture === 'weeping_willow') {
          drawWillow(ctx, cx, by);
      } else if (dna.growthArchitecture === 'data_blossom') {
          drawDataBlossom(ctx, cx, cy, width, height);
      }
  };

  // ----------------------------------------------------------------------
  // PHYSICS & ANIMATION
  // ----------------------------------------------------------------------

  const updatePhysics = (audio: { bass: number, mid: number, treble: number }) => {
      const vol = (audio.bass + audio.mid + audio.treble) / 3;
      
      // HYPER SENSITIVITY: Threshold lowered significantly
      // With the 5.0x Gain, normal speech is around 100-200. Background noise is ~20-50.
      if (vol > 150) { 
          stressRef.current = Math.min(1.0, stressRef.current + 0.04); 
      } else {
          stressRef.current = Math.max(0.0, stressRef.current - 0.02);
      }
      
      const delta = Math.abs(vol - lastVolRef.current);
      energyRef.current = Math.min(1.0, delta / 30); 
      lastVolRef.current = vol;

      if (onBioUpdate) onBioUpdate({ stress: stressRef.current, energy: energyRef.current });
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSoftBackground(ctx, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (labState === 'EMPTY') {
        growthRef.current = 0; stressRef.current = 0;
        ctx.fillStyle = '#00000040';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("WAITING FOR BIO-SYNTHESIS...", cx, cy);
        
        // Idle animation
        drawCellularCluster(ctx, cx, cy, 20 + Math.sin(Date.now()/500)*5, '#00000020', '#000000');
        
        requestRef.current = requestAnimationFrame(animate);
        return;
    }

    if (labState === 'SYNTHESIZED') {
        const pulse = Math.sin(Date.now() / 300) * 5;
        // Draw Seed
        drawCellularCluster(ctx, cx, cy, 30 + pulse, dna.colorPalette[1], dna.colorPalette[0]);
        
        ctx.fillStyle = '#00000080';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
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
        windRef.current += 0.02 + (audio.mid / 1000);
    } 

    timeRef.current += 0.02;
    const by = canvas.height * 0.9;
    
    // RISOGRAPH OFFSET (Misalignment Physics)
    const baseOffset = 4 + (stressRef.current * 40);
    const offsetX = Math.sin(timeRef.current * 8) * baseOffset;
    const offsetY = Math.cos(timeRef.current * 5) * baseOffset;

    const pulse = 1.0 + (energyRef.current * 0.2);
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    ctx.translate(-cx, -cy);

    // LAYER A (Cyan/Blue Channel)
    ctx.save();
    ctx.translate(offsetX, offsetY);
    drawArchitecture(ctx, cx, cy, by, canvas.width, canvas.height);
    ctx.restore();

    // LAYER B (Pink/Red Channel - Misaligned)
    ctx.save();
    ctx.translate(-offsetX, -offsetY);
    ctx.globalAlpha = 0.7; // Transparency for blending
    drawArchitecture(ctx, cx, cy, by, canvas.width, canvas.height);
    ctx.restore();

    ctx.restore();

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [analyzer, dna, labState]);

  // Snapshot Logic
  useEffect(() => {
      if (triggerSnapshot && canvasRef.current) {
          const cvs = canvasRef.current;
          const tmp = document.createElement('canvas');
          tmp.width = cvs.width; tmp.height = cvs.height;
          const tCtx = tmp.getContext('2d');
          if(tCtx) {
              tCtx.fillStyle = '#fcfbf8'; 
              tCtx.fillRect(0,0,tmp.width,tmp.height);
              tCtx.drawImage(cvs,0,0);
              tCtx.font = '20px monospace';
              tCtx.fillStyle = '#000';
              tCtx.fillText(`${dna.speciesName.toUpperCase()}`, 20, 40);
              onSnapshot(tmp.toDataURL('image/png'));
          }
      }
  }, [triggerSnapshot]);

  // Resize Listener
  useEffect(() => {
      const resize = () => {
          if(canvasRef.current && canvasRef.current.parentElement) {
              canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
              canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
          }
      };
      window.addEventListener('resize', resize);
      resize();
      return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-transparent">
        <canvas ref={canvasRef} className="block w-full h-full mix-blend-multiply" />
        {labState === 'GROWING' && (
             <div className="absolute top-4 left-4 font-mono text-[10px] bg-white/90 p-2 border border-black pointer-events-none z-10 shadow-sm">
                 <div>STRESS: {(stressRef.current * 100).toFixed(0)}%</div>
                 <div className="w-24 h-1 bg-gray-200 mt-1"><div className="h-full bg-riso-pink transition-all duration-75" style={{width: `${stressRef.current*100}%`}}></div></div>
                 <div className="mt-2">ENERGY: {(energyRef.current * 100).toFixed(0)}%</div>
                 <div className="text-gray-400 mt-1">{analyzer ? "LINKED" : "NO SIGNAL"}</div>
             </div>
        )}
    </div>
  );
};

export default PlantCanvas;