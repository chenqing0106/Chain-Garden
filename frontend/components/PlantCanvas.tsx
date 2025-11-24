
import React, { useRef, useEffect } from 'react';
import { PlantDNA, AudioSource } from '../types';

interface PlantCanvasProps {
  analyzer: AudioSource | null;
  dna: PlantDNA;
  isPlaying: boolean;
  onSnapshot: (dataUrl: string) => void;
  triggerSnapshot: boolean;
}

const PlantCanvas: React.FC<PlantCanvasProps> = ({ analyzer, dna, isPlaying, onSnapshot, triggerSnapshot }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const growthRef = useRef<number>(0); 
  const windRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // ----------------------------------------------------------------------
  // SHAPE UTILS
  // ----------------------------------------------------------------------
  const drawLeafShape = (
      ctx: CanvasRenderingContext2D, 
      type: string, 
      size: number, 
      sway: number
  ) => {
    if (type === 'round') {
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'needle') {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-size/4 + sway, -size * 3);
        ctx.lineTo(size/4 + sway, -size * 3);
        ctx.fill();
    } else if (type === 'heart') {
        ctx.beginPath();
        ctx.moveTo(0, size/3);
        ctx.bezierCurveTo(0, -size/2, -size, -size/2, -size, size/2);
        ctx.bezierCurveTo(-size, size, 0, size * 1.5, 0, size * 2);
        ctx.bezierCurveTo(0, size * 1.5, size, size, size, size/2);
        ctx.bezierCurveTo(size, -size/2, 0, -size/2, 0, size/3);
        ctx.fill();
    } else if (type === 'fern') {
        for(let i=0; i<5; i++) {
            ctx.beginPath();
            ctx.ellipse(0, -i*(size/2), size/3, size, Math.PI/4, 0, Math.PI*2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(0, -i*(size/2), size/3, size, -Math.PI/4, 0, Math.PI*2);
            ctx.fill();
        }
    } else if (type === 'crystal') {
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size, 0);
        ctx.fill();
    } else {
        ctx.fillRect(-size, -size, size * 2, size * 2);
    }
  }

  // ----------------------------------------------------------------------
  // RECURSIVE / GENERATIVE DRAWING FUNCTIONS
  // (Now stateless regarding colors - colors passed from Main Loop)
  // ----------------------------------------------------------------------

  const drawFractal = (ctx: CanvasRenderingContext2D, x: number, y: number, len: number, angle: number, depth: number, width: number, audio: any, maxDepth: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle * Math.PI / 180);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -len);
      // Warp trunk on bass
      if (audio.bass > 180 && depth < 2) ctx.quadraticCurveTo(10, -len/2, 0, -len);
      
      ctx.lineWidth = width;
      ctx.stroke();

      if (depth > 2 && (depth % 2 === 0 || depth === maxDepth)) {
          const leafSize = (15 - depth) + (audio.treble/40);
          ctx.save();
          ctx.translate(0, -len * 0.8);
          // High treble jitter
          const jitter = audio.treble > 200 ? Math.random() * 0.5 : 0;
          ctx.rotate(jitter);
          
          // Draw leaf (color is set in main loop context)
          drawLeafShape(ctx, dna.leafShape, leafSize, 0);
          ctx.restore();
      }

      if (depth < maxDepth && len > 2) {
          const growth = Math.min(growthRef.current / (10 * depth + 1), 1);
          const curLen = len * growth;
          if (curLen > 5) {
              const spread = dna.angleVariance + (audio.bass / 20);
              const sway = Math.sin(windRef.current + depth) * (5 + audio.mid/20);
              drawFractal(ctx, 0, -curLen, len * dna.branchingFactor, -spread + sway, depth + 1, width * 0.7, audio, maxDepth);
              drawFractal(ctx, 0, -curLen, len * dna.branchingFactor, spread + sway, depth + 1, width * 0.7, audio, maxDepth);
          }
      }
      ctx.restore();
  };

  const drawVine = (ctx: CanvasRenderingContext2D, x: number, y: number, audio: any) => {
      const segments = 50;
      let cx = x, cy = y, angle = -90;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      for(let i=0; i < segments * (growthRef.current/100); i++) {
          const wiggle = Math.sin(i * 0.2 + windRef.current) * (dna.angleVariance/2) + (Math.cos(i)*5);
          angle += wiggle * 0.1 + (i * 0.5);
          
          // Audio Displacement
          const glitch = audio.bass > 200 ? (Math.random()-0.5)*10 : 0;
          
          const nx = cx + Math.cos(angle * Math.PI/180) * 15 + glitch;
          const ny = cy + Math.sin(angle * Math.PI/180) * 15 + glitch;
          
          ctx.lineWidth = Math.max(1, 8 - (i*0.1));
          ctx.lineTo(nx, ny);
          ctx.stroke();
          
          if(i % 3 === 0) {
              ctx.save();
              ctx.translate(nx, ny);
              ctx.rotate(angle * Math.PI/180 + Math.PI/2);
              drawLeafShape(ctx, dna.leafShape, 12, 0);
              ctx.restore();
          }
          cx = nx; cy = ny;
          ctx.beginPath(); ctx.moveTo(cx, cy);
      }
  };

  const drawSucculent = (ctx: CanvasRenderingContext2D, x: number, y: number, audio: any) => {
      const layers = 8 * (growthRef.current / 100);
      const breathe = 1 + (audio.bass / 255) * 0.2;
      
      for (let i = 0; i < layers; i++) {
          const radius = i * 15 * breathe;
          const petals = 5 + i * 2;
          const step = (Math.PI * 2) / petals;
          
          for (let j = 0; j < petals; j++) {
              const rot = windRef.current * 0.2 + (audio.mid/1000);
              const angle = j * step + (i%2 ? step/2 : 0) + rot;
              const px = x + Math.cos(angle) * radius;
              const py = y + Math.sin(angle) * radius;
              
              ctx.save();
              ctx.translate(px, py);
              ctx.rotate(angle + Math.PI/2);
              drawLeafShape(ctx, dna.leafShape, 10 + i*5, 0);
              ctx.restore();
          }
      }
  };

  const drawWillow = (ctx: CanvasRenderingContext2D, x: number, y: number, audio: any) => {
      const height = 150 * (growthRef.current/100);
      
      // Trunk
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 20, y - height/2, x, y - height);
      ctx.lineWidth = 15;
      ctx.stroke();

      // Branches
      const topY = y - height;
      const branches = 12;
      for(let i=0; i<branches; i++) {
          const offset = (i/branches) * Math.PI*2;
          const bx = x + Math.cos(offset) * 40;
          const by = topY + Math.sin(offset) * 10;
          
          ctx.beginPath();
          ctx.moveTo(x, topY);
          ctx.quadraticCurveTo(x, topY-50, bx, by);
          ctx.lineWidth = 4;
          ctx.stroke();
          
          // Vines
          const vineLen = 180 * (growthRef.current/100);
          let vx = bx, vy = by;
          ctx.beginPath(); ctx.moveTo(vx, vy);
          
          for(let s=0; s<20; s++) {
               const wave = Math.sin(s*0.5 + timeRef.current*3) * (s * (audio.bass/80));
               const nx = vx + wave;
               const ny = vy + (vineLen/20);
               ctx.lineTo(nx, ny);
               if (s%2 === 0) {
                   ctx.save(); ctx.translate(nx, ny);
                   drawLeafShape(ctx, 'needle', 6, wave);
                   ctx.restore();
               }
               vx = nx; vy = ny;
          }
          ctx.lineWidth = 1;
          ctx.stroke();
      }
  };

  const drawArchitecture = (ctx: CanvasRenderingContext2D, cx: number, cy: number, by: number, audio: any) => {
      if (dna.growthArchitecture === 'fractal_tree') {
          drawFractal(ctx, cx, by, 100, 0, 0, 15, audio, 8);
      } else if (dna.growthArchitecture === 'organic_vine') {
          drawVine(ctx, cx, by, audio);
          drawVine(ctx, cx - 80, by, audio);
          drawVine(ctx, cx + 80, by, audio);
      } else if (dna.growthArchitecture === 'radial_succulent') {
          drawSucculent(ctx, cx, cy, audio);
      } else if (dna.growthArchitecture === 'fern_frond') {
          drawFractal(ctx, cx, by, 120, 0, 0, 8, audio, 6);
          drawFractal(ctx, cx - 30, by, 90, -30, 0, 6, audio, 5);
          drawFractal(ctx, cx + 30, by, 90, 30, 0, 6, audio, 5);
      } else if (dna.growthArchitecture === 'weeping_willow') {
          drawWillow(ctx, cx, by, audio);
      } else if (dna.growthArchitecture === 'alien_shrub') {
          // Simplified implementation for brevity, re-using fractal with weird params
          drawFractal(ctx, cx, by, 60, 0, 0, 20, audio, 5);
          drawFractal(ctx, cx-50, by, 40, -45, 0, 15, audio, 4);
      } else if (dna.growthArchitecture === 'crystal_cactus') {
          drawSucculent(ctx, cx, cy, audio); // Reuse succulent logic but with 'crystal' leaf shape
      }
  };

  // ----------------------------------------------------------------------
  // MAIN ANIMATION LOOP
  // ----------------------------------------------------------------------
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let audio = { bass: 0, mid: 0, treble: 0 };
    if (analyzer && isPlaying) {
        audio = analyzer.getFrequencyData();
        if (growthRef.current < 100) growthRef.current += dna.growthSpeed * 0.1;
        windRef.current += 0.02 + (audio.mid / 5000);
        timeRef.current += 0.01;
    } else {
        if (growthRef.current > 0) {
             windRef.current += 0.01;
             timeRef.current += 0.01;
        }
    }

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const by = canvas.height * 0.9;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // RISOGRAPH MISALIGNMENT EFFECT
    // We draw the plant TWICE with different colors and blend modes
    // The offset between layers mimics the printing error, driven by Bass.
    
    const shake = audio.bass > 100 ? (audio.bass / 50) : 1;
    const offsetX = Math.sin(timeRef.current * 10) * shake;
    const offsetY = Math.cos(timeRef.current * 10) * shake;

    // LAYER 1: Cyan/Blue/Green (The Structure)
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.globalCompositeOperation = 'multiply';
    ctx.strokeStyle = dna.colorPalette[0]; // Stem Color
    ctx.fillStyle = dna.colorPalette[1];   // Leaf Color
    drawArchitecture(ctx, cx, cy, by, audio);
    ctx.restore();

    // LAYER 2: Pink/Magenta/Yellow (The Highlights)
    // Drawn slightly offset
    ctx.save();
    ctx.translate(-offsetX, -offsetY);
    ctx.globalCompositeOperation = 'multiply';
    // Swap colors slightly for visual interest or use accent
    ctx.strokeStyle = dna.colorPalette[0];
    ctx.fillStyle = dna.colorPalette[2]; // Accent Color
    drawArchitecture(ctx, cx, cy, by, audio);
    ctx.restore();

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [analyzer, isPlaying, dna]);

  // Handle Snapshot (unchanged logic mostly)
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
              // Add Grain
              tCtx.globalAlpha = 0.1;
              for(let i=0; i<1000; i++) {
                  tCtx.fillRect(Math.random()*tmp.width, Math.random()*tmp.height, 2, 2);
              }
              tCtx.globalAlpha = 1.0;
              tCtx.font = '20px monospace';
              tCtx.fillStyle = '#000';
              tCtx.fillText(`SPECIMEN: ${dna.speciesName.toUpperCase()}`, 20, 40);
              onSnapshot(tmp.toDataURL('image/png'));
          }
      }
  }, [triggerSnapshot]);

  // Resize Handler
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
    </div>
  );
};

export default PlantCanvas;
