
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
  const growthRef = useRef<number>(0); // 0 to 100
  const windRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // ----------------------------------------------------------------------
  // UTILS
  // ----------------------------------------------------------------------
  
  // Helper to shift hex color based on audio intensity
  const shiftColor = (hex: string, intensity: number) => {
      // Very simple hue shift simulation or brightness boost
      if (intensity < 50) return hex;
      return hex; // For now keeping it simple to avoid expensive HSL conversion every frame
  };

  // ----------------------------------------------------------------------
  // LEAF RENDERING
  // ----------------------------------------------------------------------
  const drawLeaf = (
    ctx: CanvasRenderingContext2D,
    size: number,
    color: string,
    accent: string,
    type: string,
    audioData: { bass: number, mid: number, treble: number }
  ) => {
    ctx.save();
    
    // Audio Reactivity: Pulse size + Jitter rotation
    const pulse = 1 + (audioData.bass / 255) * 0.3;
    const jitter = (Math.random() - 0.5) * (audioData.treble / 255);
    
    ctx.scale(pulse, pulse);
    ctx.rotate(jitter);

    // Color shifting on high treble
    ctx.fillStyle = audioData.treble > 200 ? accent : color;
    ctx.globalCompositeOperation = 'multiply';

    if (type === 'round') {
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(size/3, -size/3, size/4, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'needle') {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      // Needle shakes with mid frequencies
      const sway = Math.sin(timeRef.current * 10) * (audioData.mid/50);
      ctx.lineTo(-size/4 + sway, -size * 3);
      ctx.lineTo(size/4 + sway, -size * 3);
      ctx.fill();

    } else if (type === 'heart') {
      ctx.beginPath();
      const topCurveHeight = size * 0.5;
      ctx.moveTo(0, size/3);
      ctx.bezierCurveTo(0, -size/2, -size, -size/2, -size, topCurveHeight);
      ctx.bezierCurveTo(-size, size + topCurveHeight, 0, size * 1.5, 0, size * 2);
      ctx.bezierCurveTo(0, size * 1.5, size, size + topCurveHeight, size, topCurveHeight);
      ctx.bezierCurveTo(size, -size/2, 0, -size/2, 0, size/3);
      ctx.fill();
      
    } else if (type === 'fern') {
      for(let i=0; i<5; i++) {
          ctx.beginPath();
          ctx.ellipse(0, -i*(size/2), size/3, size, Math.PI/4, 0, Math.PI*2);
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
       // Inner shape
       ctx.fillStyle = accent;
       ctx.beginPath();
       ctx.moveTo(0, -size/2);
       ctx.lineTo(size/2, 0);
       ctx.lineTo(0, size/2);
       ctx.lineTo(-size/2, 0);
       ctx.fill();
    } else {
      // Abstract
      ctx.fillStyle = color;
      ctx.fillRect(-size, -size, size * 2, size * 2);
      ctx.fillStyle = accent;
      ctx.fillRect(-size/2, -size/2, size, size);
    }
    ctx.restore();
  };

  // ----------------------------------------------------------------------
  // ARCHITECTURE: FRACTAL TREE (Classic)
  // ----------------------------------------------------------------------
  const drawFractal = (
    ctx: CanvasRenderingContext2D, 
    startX: number, 
    startY: number, 
    length: number, 
    angle: number, 
    depth: number, 
    width: number,
    audioData: { bass: number, mid: number, treble: number },
    maxDepth: number
  ) => {
    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate(angle * Math.PI / 180);

    // Branch drawing
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -length);
    ctx.strokeStyle = dna.colorPalette[0];
    
    // Bass swells the trunk thickness
    ctx.lineWidth = width * (1 + (audioData.bass / 500)); 
    ctx.lineCap = 'round';
    ctx.stroke();

    // Leaf Logic
    if (depth > 2 && (depth % 2 === 0 || depth === maxDepth)) {
        const leafSize = (15 - depth) + (audioData.treble/40);
        ctx.save();
        ctx.translate(0, -length * 0.8);
        if (dna.leafArrangement === 'opposite') {
             ctx.save(); ctx.rotate(Math.PI/4); drawLeaf(ctx, leafSize, dna.colorPalette[1], dna.colorPalette[2], dna.leafShape, audioData); ctx.restore();
             ctx.save(); ctx.rotate(-Math.PI/4); drawLeaf(ctx, leafSize, dna.colorPalette[1], dna.colorPalette[2], dna.leafShape, audioData); ctx.restore();
        } else {
             const dir = depth % 2 === 0 ? 1 : -1;
             ctx.rotate(dir * Math.PI/3);
             drawLeaf(ctx, leafSize, dna.colorPalette[1], dna.colorPalette[2], dna.leafShape, audioData);
        }
        ctx.restore();
    }

    if (depth < maxDepth && length > 2) {
        const growthFactor = Math.min(growthRef.current / (10 * depth + 1), 1);
        const currentLen = length * growthFactor;
        
        if (currentLen > 5) {
            // Audio Effect: Bass spreads the branches wider
            const spread = dna.angleVariance + (audioData.bass / 20);
            // Audio Effect: Mids sway the branches
            const sway = Math.sin(windRef.current + depth) * (5 + audioData.mid/20);

            drawFractal(ctx, 0, -currentLen, length * dna.branchingFactor, -spread + sway, depth + 1, width * 0.7, audioData, maxDepth);
            drawFractal(ctx, 0, -currentLen, length * dna.branchingFactor, spread + sway, depth + 1, width * 0.7, audioData, maxDepth);
        }
    }
    ctx.restore();
  };

  // ----------------------------------------------------------------------
  // ARCHITECTURE: VINE (Wandering)
  // ----------------------------------------------------------------------
  const drawVine = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    audioData: { bass: number, mid: number, treble: number }
  ) => {
      const segments = 50;
      const segmentLen = 15;
      let currentX = startX;
      let currentY = startY;
      let angle = -90; 

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      for (let i = 0; i < segments * (growthRef.current/100); i++) {
          // Mid frequency makes the vine wiggle more intensely
          const wiggleIntensity = dna.angleVariance/2 + (audioData.mid / 10);
          const wiggle = Math.sin(i * 0.2 + windRef.current) * wiggleIntensity + (Math.cos(i)*5);
          
          angle += wiggle * 0.1;
          angle += (i * 0.5); // Gravity
          
          // Glitchy offset on heavy bass
          const glitch = audioData.bass > 200 ? (Math.random()-0.5)*10 : 0;
          
          const nextX = currentX + Math.cos(angle * Math.PI / 180) * segmentLen + glitch;
          const nextY = currentY + Math.sin(angle * Math.PI / 180) * segmentLen + glitch;
          
          ctx.lineWidth = Math.max(1, 8 - (i * 0.1));
          ctx.strokeStyle = dna.colorPalette[0];
          ctx.lineTo(nextX, nextY);
          ctx.stroke();
          
          if (i % 3 === 0) {
              ctx.save();
              ctx.translate(nextX, nextY);
              ctx.rotate(angle * Math.PI / 180 + Math.PI/2); 
              drawLeaf(ctx, 12, dna.colorPalette[1], dna.colorPalette[2], dna.leafShape, audioData);
              ctx.restore();
          }

          currentX = nextX;
          currentY = nextY;
          ctx.beginPath();
          ctx.moveTo(currentX, currentY);
      }
  };

  // ----------------------------------------------------------------------
  // ARCHITECTURE: SUCCULENT (Radial)
  // ----------------------------------------------------------------------
  const drawSucculent = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    audioData: { bass: number, mid: number, treble: number }
  ) => {
      const layers = 8 * (growthRef.current / 100);
      // Bass expands the whole flower
      const breathe = 1 + (audioData.bass / 255) * 0.1;

      for (let i = 0; i < layers; i++) {
          const radius = i * 15 * breathe;
          const petals = 5 + i * 2;
          const angleStep = (Math.PI * 2) / petals;
          const layerRotation = i % 2 === 0 ? 0 : angleStep / 2;

          for (let j = 0; j < petals; j++) {
             // Mids rotate the flower slightly
             const rotation = windRef.current * 0.2 + (audioData.mid/1000);
             const angle = j * angleStep + layerRotation + rotation;
             
             const x = centerX + Math.cos(angle) * radius;
             const y = centerY + Math.sin(angle) * radius;
             
             ctx.save();
             ctx.translate(x, y);
             ctx.rotate(angle + Math.PI/2);
             
             const color = i < layers/2 ? dna.colorPalette[1] : dna.colorPalette[2];
             const size = (10 + i * 5);
             
             drawLeaf(ctx, size, color, dna.colorPalette[0], dna.leafShape, audioData);
             ctx.restore();
          }
      }
  };

  // ----------------------------------------------------------------------
  // ARCHITECTURE: WEEPING WILLOW (Gravity + Physics)
  // ----------------------------------------------------------------------
  const drawWillow = (
      ctx: CanvasRenderingContext2D,
      startX: number,
      startY: number,
      audioData: { bass: number, mid: number, treble: number }
  ) => {
      // Trunk
      const trunkHeight = 150 * (growthRef.current/100);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(startX + 20, startY - trunkHeight/2, startX, startY - trunkHeight);
      ctx.lineWidth = 15;
      ctx.strokeStyle = dna.colorPalette[0];
      ctx.stroke();

      const topY = startY - trunkHeight;
      const branches = 12;
      
      for(let i=0; i<branches; i++) {
          const angleOffset = (i / branches) * Math.PI * 2;
          // Mids cause swaying
          const sway = Math.sin(timeRef.current * 2 + i) * (audioData.mid / 10);
          
          let bx = startX + Math.cos(angleOffset) * 40;
          let by = topY + Math.sin(angleOffset) * 10;
          
          ctx.beginPath();
          ctx.moveTo(startX, topY);
          ctx.quadraticCurveTo(startX + sway, topY - 50, bx, by);
          ctx.lineWidth = 5;
          ctx.stroke();
          
          // Drooping Vines
          const vineLen = 180 * (growthRef.current/100);
          const segments = 20;
          
          ctx.beginPath();
          ctx.moveTo(bx, by);
          for(let s=0; s<segments; s++) {
              // Physics wave
              const wave = Math.sin(s * 0.5 + timeRef.current * 3 + sway/10) * (s * (audioData.bass/50));
              const nextX = bx + wave;
              const nextY = by + (vineLen/segments);
              
              ctx.lineTo(nextX, nextY);
              
              // Leaves on vine
              if(s % 2 === 0) {
                 ctx.save();
                 ctx.translate(nextX, nextY);
                 // Leaves flutter with Treble
                 ctx.rotate(Math.sin(timeRef.current * 10) * (audioData.treble/50));
                 drawLeaf(ctx, 6, dna.colorPalette[1], dna.colorPalette[2], 'needle', audioData);
                 ctx.restore();
              }
              
              bx = nextX;
              by = nextY;
          }
          ctx.lineWidth = 1;
          ctx.stroke();
      }
  };

  // ----------------------------------------------------------------------
  // ARCHITECTURE: ALIEN SHRUB (Glitchy)
  // ----------------------------------------------------------------------
  const drawAlien = (
      ctx: CanvasRenderingContext2D,
      startX: number,
      startY: number,
      audioData: { bass: number, mid: number, treble: number }
  ) => {
      const nodes = 6;
      let currX = startX;
      let currY = startY;
      
      for(let i=0; i<nodes; i++) {
          if (growthRef.current < (i+1)*15) break;

          // Erratic angles
          const angle = -90 + (Math.sin(i * 99 + timeRef.current)*45);
          // Bass stretches it
          const len = 40 + (audioData.bass / 5);
          
          const nextX = currX + Math.cos(angle * Math.PI/180) * len;
          const nextY = currY + Math.sin(angle * Math.PI/180) * len;
          
          // Draw Stick
          ctx.beginPath();
          ctx.moveTo(currX, currY);
          ctx.lineTo(nextX, nextY);
          ctx.strokeStyle = dna.colorPalette[0];
          ctx.lineWidth = 6 - i;
          ctx.stroke();
          
          // Draw weird fruit/orb at joint
          ctx.fillStyle = audioData.treble > 150 ? dna.colorPalette[2] : dna.colorPalette[1];
          ctx.beginPath();
          const bulbSize = 8 + (audioData.mid/20);
          ctx.arc(nextX, nextY, bulbSize, 0, Math.PI*2);
          ctx.fill();
          
          // Glitch lines coming off
          if (audioData.treble > 100) {
              ctx.beginPath();
              ctx.moveTo(nextX, nextY);
              ctx.lineTo(nextX + (Math.random()-0.5)*50, nextY + (Math.random()-0.5)*50);
              ctx.strokeStyle = dna.colorPalette[2];
              ctx.lineWidth = 1;
              ctx.stroke();
          }

          currX = nextX;
          currY = nextY;
      }
  };

  // ----------------------------------------------------------------------
  // ARCHITECTURE: CRYSTAL CACTUS (Geometric)
  // ----------------------------------------------------------------------
  const drawCrystal = (
      ctx: CanvasRenderingContext2D,
      startX: number,
      startY: number,
      audioData: { bass: number, mid: number, treble: number }
  ) => {
      const height = 150 * (growthRef.current/100);
      // Bass makes it wider
      const width = 60 + (audioData.bass / 5); 
      
      ctx.save();
      ctx.translate(startX, startY - height/2);
      
      // Main Body (Diamond)
      ctx.beginPath();
      ctx.moveTo(0, -height/2);
      ctx.lineTo(width/2, 0);
      ctx.lineTo(0, height/2);
      ctx.lineTo(-width/2, 0);
      ctx.closePath();
      
      ctx.fillStyle = dna.colorPalette[1];
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = dna.colorPalette[0];
      ctx.stroke();
      
      // Floating Segments (Satellite crystals)
      const sats = 4;
      for(let i=0; i<sats; i++) {
          const orbit = timeRef.current + (i * Math.PI/2);
          const dist = width * 0.8 + (audioData.mid/10);
          
          const sx = Math.cos(orbit) * dist;
          const sy = Math.sin(orbit) * dist * 0.5; // Elliptical orbit
          
          drawLeaf(ctx, 15, dna.colorPalette[2], dna.colorPalette[0], 'crystal', audioData);
      }
      
      ctx.restore();
  };

  // ----------------------------------------------------------------------
  // MAIN LOOP
  // ----------------------------------------------------------------------
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get Audio Data
    let audioData = { bass: 0, mid: 0, treble: 0, raw: new Uint8Array(0) };
    if (analyzer && isPlaying) {
      audioData = analyzer.getFrequencyData();
      if (growthRef.current < 100) {
        growthRef.current += dna.growthSpeed * 0.1 + (audioData.mid / 255) * 0.1;
      }
      // Dynamic Wind
      windRef.current += 0.02 + (audioData.mid / 3000);
      timeRef.current += 0.01 + (audioData.treble / 5000); // Time dilation with treble
    } else if (!isPlaying && growthRef.current > 0) {
        windRef.current += 0.01;
        timeRef.current += 0.01;
    }

    const centerX = canvas.width / 2;
    const bottomY = canvas.height * 0.9;
    const centerY = canvas.height / 2;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (dna.growthArchitecture === 'fractal_tree') {
        drawFractal(ctx, centerX, bottomY, 100, 0, 0, 15, audioData, 8);
    } else if (dna.growthArchitecture === 'fern_frond') {
        drawFractal(ctx, centerX, bottomY, 120, 0, 0, 8, audioData, 6);
        drawFractal(ctx, centerX - 20, bottomY, 80, -30, 0, 6, audioData, 5);
        drawFractal(ctx, centerX + 20, bottomY, 80, 30, 0, 6, audioData, 5);
    } else if (dna.growthArchitecture === 'organic_vine') {
        drawVine(ctx, centerX, bottomY, audioData);
        drawVine(ctx, centerX - 80, bottomY, audioData);
        drawVine(ctx, centerX + 80, bottomY, audioData);
    } else if (dna.growthArchitecture === 'radial_succulent') {
        drawSucculent(ctx, centerX, centerY, audioData);
    } else if (dna.growthArchitecture === 'weeping_willow') {
        drawWillow(ctx, centerX, bottomY, audioData);
    } else if (dna.growthArchitecture === 'alien_shrub') {
        drawAlien(ctx, centerX, bottomY, audioData);
        drawAlien(ctx, centerX - 100, bottomY, audioData);
    } else if (dna.growthArchitecture === 'crystal_cactus') {
        drawCrystal(ctx, centerX, centerY + 50, audioData);
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [analyzer, isPlaying, dna]);

  // Snapshot handling (Keep existing logic mostly same but adapted if needed)
  useEffect(() => {
    if (triggerSnapshot && canvasRef.current) {
        const canvas = canvasRef.current;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const ctx = tempCanvas.getContext('2d');
        if(ctx) {
            ctx.fillStyle = '#fcfbf8';
            ctx.fillRect(0,0, tempCanvas.width, tempCanvas.height);
            ctx.drawImage(canvas, 0, 0);
            
            ctx.globalAlpha = 0.1;
            for(let x=0; x<tempCanvas.width; x+=4) {
                for(let y=0; y<tempCanvas.height; y+=4) {
                    if(Math.random() > 0.5) ctx.fillRect(x,y,2,2);
                }
            }
            ctx.globalAlpha = 1.0;

            ctx.font = '20px Courier New';
            ctx.fillStyle = '#1a1a1a';
            ctx.fillText(`SPECIMEN: ${dna.speciesName.toUpperCase()}`, 20, 40);
            ctx.fillText(`TYPE: ${dna.growthArchitecture.toUpperCase()}`, 20, 65);
            ctx.fillText(`DATE: ${new Date().toLocaleDateString()}`, 20, 90);
            
            onSnapshot(tempCanvas.toDataURL('image/png'));
        }
    }
  }, [triggerSnapshot]);

  // Handle Resize
  useEffect(() => {
      const handleResize = () => {
          if (canvasRef.current && canvasRef.current.parentElement) {
              canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
              canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
          }
      }
      window.addEventListener('resize', handleResize);
      handleResize();
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-transparent">
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full mix-blend-multiply"
      />
    </div>
  );
};

export default PlantCanvas;
