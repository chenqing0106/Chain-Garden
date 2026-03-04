import React, { useRef, useEffect, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { PlantDNA, AudioSource, LabState, BioState } from "../types";
import { DrawState, PhysicsRefs } from "./plantCanvas/types";
import { drawSoftBackground, drawCellularCluster } from "./plantCanvas/primitives";
import { updatePhysics } from "./plantCanvas/physics";
import { drawArchitecture } from "./plantCanvas/architectures/index";

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

  // 频段分区生长进度
  const bassGrowthRef = useRef<number>(0);
  const midGrowthRef = useRef<number>(0);
  const trebleGrowthRef = useRef<number>(0);

  // 实时脉冲效果
  const bassPulseRef = useRef<number>(0);
  const midPulseRef = useRef<number>(0);
  const treblePulseRef = useRef<number>(0);

  // 上一帧频率值
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
  // ANIMATION LOOP
  // ----------------------------------------------------------------------

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSoftBackground(ctx, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const buildState = (): DrawState => ({
      mouse: mouseRef.current,
      growth: growthRef.current,
      time: timeRef.current,
      wind: windRef.current,
      stress: stressRef.current,
      energy: energyRef.current,
      bass: { growth: bassGrowthRef.current, pulse: bassPulseRef.current },
      mid: { growth: midGrowthRef.current, pulse: midPulseRef.current },
      treble: { growth: trebleGrowthRef.current, pulse: treblePulseRef.current },
      descriptionWords,
      speciesName: dna.speciesName,
    });

    if (labState === "EMPTY") {
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
      drawCellularCluster(ctx, cx, cy, 20 + Math.sin(Date.now() / 500) * 5, "#00000020", "#000000", buildState());
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    if (labState === "SYNTHESIZED") {
      const pulse = Math.sin(Date.now() / 300) * 5;
      drawCellularCluster(ctx, cx, cy, 30 + pulse, dna.colorPalette[1] ?? "#5fb895", dna.colorPalette[0] ?? "#2d3436", buildState());
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

      const physRefs: PhysicsRefs = {
        growthRef, windRef, stressRef, energyRef, lastVolRef,
        bassGrowthRef, midGrowthRef, trebleGrowthRef,
        bassPulseRef, midPulseRef, treblePulseRef,
        lastBassRef, lastMidRef, lastTrebleRef,
      };
      updatePhysics(physRefs, audio, dna.growthSpeed, onBioUpdate);

      const totalVol = (audio.bass + audio.mid + audio.treble) / 3;
      if (totalVol > 0.1) {
        if (growthRef.current < 100) {
          const nutrientFactor = Math.max(0.2, totalVol / 100);
          growthRef.current += dna.growthSpeed * 0.4 * nutrientFactor;
        }
      }
      windRef.current += 0.02 + audio.mid / 1000;
    }

    timeRef.current += 0.02;
    const by = canvas.height * 0.7;

    drawArchitecture(ctx, cx, cy, by, canvas.width, canvas.height, buildState(), dna);

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
