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

  // ----------------------------------------------------------------------
  // LEAF RENDERING
  // ----------------------------------------------------------------------
  const drawLeaf = (
    ctx: CanvasRenderingContext2D,
    size: number,
    color: string,
    accent: string,
    type: string,
    audioTreble: number
  ) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalCompositeOperation = 'multiply'; // Riso ink blending

    // Treble makes leaves pulse
    const pulse = (audioTreble / 255) * 0.5 + 0.8; 
    ctx.scale(pulse, pulse);

    if (type === 'round') {
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      // Accent dot
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(size/3, -size/3, size/4, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'needle') {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-size/4, -size * 3);
      ctx.lineTo(size/4, -size * 3);
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
      // Compound leaf look
      for(let i=0; i<5; i++) {
          ctx.beginPath();
          ctx.ellipse(0, -i*(size/2), size/3, size, Math.PI/4, 0, Math.PI*2);
          ctx.ellipse(0, -i*(size/2), size/3, size, -Math.PI/4, 0, Math.PI*2);
          ctx.fill();
      }
    } else {
      // Abstract / Blocky
      ctx.fillStyle = color;
      ctx.fillRect(-size, -size, size * 2, size * 2);
      ctx.fillStyle = accent;
      ctx.fillRect(-size/2, -size/2, size, size);
    }
    ctx.restore();
  };

  // ----------------------------------------------------------------------
  // GENERATOR: RECURSIVE TREE / FERN
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

    // Drawing the branch/stem
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -length);
    ctx.strokeStyle = depth === 0 ? dna.colorPalette[0] : dna.colorPalette[0];
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw Leaf at nodes if not trunk
    if (depth > 2 && (depth % 2 === 0 || depth === maxDepth)) {
        const leafSize = (15 - depth) + (audioData.treble/40);
        ctx.save();
        ctx.translate(0, -length * 0.8);
        // Angle leaf based on side
        if (dna.leafArrangement === 'opposite') {
             ctx.save(); ctx.rotate(Math.PI/4); drawLeaf(ctx, leafSize, dna.colorPalette[1], dna.colorPalette[2], dna.leafShape, audioData.treble); ctx.restore();
             ctx.save(); ctx.rotate(-Math.PI/4); drawLeaf(ctx, leafSize, dna.colorPalette[1], dna.colorPalette[2], dna.leafShape, audioData.treble); ctx.restore();
        } else {
             // Alternate
             const dir = depth % 2 === 0 ? 1 : -1;
             ctx.rotate(dir * Math.PI/3);
             drawLeaf(ctx, leafSize, dna.colorPalette[1], dna.colorPalette[2], dna.leafShape, audioData.treble);
        }
        ctx.restore();
    }

    // Recursion Limit
    if (depth < maxDepth && length > 2) {
        const growthFactor = Math.min(growthRef.current / (10 * depth + 1), 1);
        const currentLen = length * growthFactor;
        
        // Branch Logic
        if (currentLen > 5) {
            const spread = dna.angleVariance + (audioData.bass / 255) * 5;
            
            // Number of branches
            const branches = dna.growthArchitecture === 'fern_frond' ? 2 : 2; 
            
            // For Ferns, we want a strong central spine + side branches
            if (dna.growthArchitecture === 'fern_frond') {
                // Continue Center
                drawFractal(ctx, 0, -currentLen, length * 0.9, Math.sin(windRef.current)*2, depth + 1, width * 0.8, audioData, maxDepth);
                // Sides
                drawFractal(ctx, 0, -currentLen*0.5, length * 0.6, -80, depth + 1, width * 0.5, audioData, maxDepth);
                drawFractal(ctx, 0, -currentLen*0.5, length * 0.6, 80, depth + 1, width * 0.5, audioData, maxDepth);
            } else {
                // Trees
                drawFractal(ctx, 0, -currentLen, length * dna.branchingFactor, -spread + Math.sin(windRef.current + depth)*5, depth + 1, width * 0.7, audioData, maxDepth);
                drawFractal(ctx, 0, -currentLen, length * dna.branchingFactor, spread + Math.sin(windRef.current + depth)*5, depth + 1, width * 0.7, audioData, maxDepth);
            }
        }
    }
    ctx.restore();
  };

  // ----------------------------------------------------------------------
  // GENERATOR: VINE
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
      let angle = -90; // Upwards initially

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      // Draw Stem
      for (let i = 0; i < segments * (growthRef.current/100); i++) {
          // Wiggle based on Perlin-ish noise (sin/cos combo) and audio bass
          const wiggle = Math.sin(i * 0.2 + windRef.current) * (dna.angleVariance/2) + (Math.cos(i)*5);
          angle += wiggle * 0.1;
          
          // Gravity effect
          angle += (i * 0.5); // Curve down
          
          // Audio shake
          const shakeX = (Math.random() - 0.5) * (audioData.bass / 50);
          const shakeY = (Math.random() - 0.5) * (audioData.bass / 50);

          const nextX = currentX + Math.cos(angle * Math.PI / 180) * segmentLen + shakeX;
          const nextY = currentY + Math.sin(angle * Math.PI / 180) * segmentLen + shakeY;
          
          // Draw segment
          ctx.lineWidth = Math.max(1, 8 - (i * 0.1));
          ctx.strokeStyle = dna.colorPalette[0];
          ctx.lineTo(nextX, nextY);
          ctx.stroke(); // Stroke each segment to support leaves
          
          // Draw Leaf
          if (i % 3 === 0) {
              ctx.save();
              ctx.translate(nextX, nextY);
              ctx.rotate(angle * Math.PI / 180 + Math.PI/2); // Perpendicular to vine
              drawLeaf(ctx, 12, dna.colorPalette[1], dna.colorPalette[2], dna.leafShape, audioData.treble);
              ctx.restore();
          }

          currentX = nextX;
          currentY = nextY;
          ctx.beginPath();
          ctx.moveTo(currentX, currentY);
      }
  };

  // ----------------------------------------------------------------------
  // GENERATOR: SUCCULENT
  // ----------------------------------------------------------------------
  const drawSucculent = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    audioData: { bass: number, mid: number, treble: number }
  ) => {
      const layers = 8 * (growthRef.current / 100);
      
      // Pulse with bass
      const pulse = (audioData.bass / 255) * 0.2 + 1.0;

      for (let i = 0; i < layers; i++) {
          const radius = i * 15;
          const petals = 5 + i * 2;
          const angleStep = (Math.PI * 2) / petals;
          
          // Rotate layers for offset effect
          const layerRotation = i % 2 === 0 ? 0 : angleStep / 2;

          for (let j = 0; j < petals; j++) {
             const angle = j * angleStep + layerRotation + windRef.current * 0.1;
             const x = centerX + Math.cos(angle) * radius * pulse;
             const y = centerY + Math.sin(angle) * radius * pulse;
             
             ctx.save();
             ctx.translate(x, y);
             ctx.rotate(angle + Math.PI/2); // Point outward
             
             // Gradient color from center
             const color = i < layers/2 ? dna.colorPalette[1] : dna.colorPalette[2];
             const size = 10 + i * 5;
             
             drawLeaf(ctx, size, color, dna.colorPalette[0], dna.leafShape, audioData.treble);
             
             ctx.restore();
          }
      }
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
      // Auto-grow
      if (growthRef.current < 100) {
        growthRef.current += dna.growthSpeed * 0.1 + (audioData.mid / 255) * 0.1;
      }
      // Wind
      windRef.current += 0.02 + (audioData.bass / 5000);
    } else if (!isPlaying && growthRef.current > 0) {
        // Slow gentle wind even when idle
        windRef.current += 0.01;
    }

    // Render based on Architecture
    const centerX = canvas.width / 2;
    const bottomY = canvas.height * 0.9;
    const centerY = canvas.height / 2;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (dna.growthArchitecture === 'fractal_tree') {
        drawFractal(ctx, centerX, bottomY, 100, 0, 0, 15, audioData, 8);
    } else if (dna.growthArchitecture === 'fern_frond') {
        // Draw 3 fronds
        drawFractal(ctx, centerX, bottomY, 120, 0, 0, 8, audioData, 6);
        drawFractal(ctx, centerX - 20, bottomY, 80, -30, 0, 6, audioData, 5);
        drawFractal(ctx, centerX + 20, bottomY, 80, 30, 0, 6, audioData, 5);
    } else if (dna.growthArchitecture === 'organic_vine') {
        // Draw multiple hanging vines from top, starting at 10% from top for better visibility
        const topY = canvas.height * 0.1; // Start from 10% from top
        drawVine(ctx, centerX, topY, audioData);
        drawVine(ctx, centerX - 120, topY + 20, audioData);
        drawVine(ctx, centerX + 120, topY + 40, audioData);
    } else if (dna.growthArchitecture === 'radial_succulent') {
        drawSucculent(ctx, centerX, centerY, audioData);
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [analyzer, isPlaying, dna]);

  // Snapshot handling
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
            
            // Add Grain to Snapshot
            ctx.globalAlpha = 0.1;
            // Simple noise gen
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