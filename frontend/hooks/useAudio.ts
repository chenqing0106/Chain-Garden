import { useState, useEffect, useRef, useCallback, ChangeEvent } from "react";
import { AudioAnalyzer } from "../services/audioService";
import { PlantMusicService } from "../services/plantMusicService";
import { demoAudioService, DEMO_PRESETS, DemoPreset } from "../services/demoAudioService";
import { PlantDNA, AudioSource, BioState } from "../types";

export { DEMO_PRESETS };

const REFLECTION_QUESTIONS = [
  "What are you holding onto that you need to let go of?",
  "Describe a moment where you felt truly at peace.",
  "What does your silence sound like today?",
  "Who do you wish you could speak to right now?",
  "What color is your current emotion?",
  "What is growing inside you that needs nourishment?",
  "If this plant could hear your secrets, what would you say?",
  "What is a memory that makes you smile?",
  "What are you afraid to say out loud?",
];

export function useAudio(dna: PlantDNA, bioState: BioState) {
  const [analyzer, setAnalyzer] = useState<AudioSource | null>(null);
  const [inputMode, setInputMode] = useState<"mic" | "file" | "reflection" | "demo" | "none">("none");
  const [isListening, setIsListening] = useState(false);
  const [isPlayingFile, setIsPlayingFile] = useState(false);
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [currentDemoPreset, setCurrentDemoPreset] = useState<DemoPreset>("balanced_music");
  const [reflectionQuestion, setReflectionQuestion] = useState(REFLECTION_QUESTIONS[0]);
  const [reflectionBlob, setReflectionBlob] = useState<Blob | null>(null);
  const [isRecordingReflection, setIsRecordingReflection] = useState(false);
  const [isSinging, setIsSinging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const audioAnalyzerRef = useRef<AudioAnalyzer>(new AudioAnalyzer());
  const plantMusicRef = useRef<PlantMusicService>(new PlantMusicService());
  const visualizerCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reflectionRecorderRef = useRef<MediaRecorder | null>(null);

  // Refs to avoid stale closures in stable callbacks
  const dnaRef = useRef(dna);
  useEffect(() => { dnaRef.current = dna; }, [dna]);
  const bioStateRef = useRef(bioState);
  useEffect(() => { bioStateRef.current = bioState; }, [bioState]);
  const isSingingRef = useRef(isSinging);
  useEffect(() => { isSingingRef.current = isSinging; }, [isSinging]);

  // Visualizer loop
  useEffect(() => {
    let animId: number;
    const drawVisualizer = () => {
      if (!visualizerCanvasRef.current) return;
      const cvs = visualizerCanvasRef.current;
      const ctx = cvs.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, cvs.width, cvs.height);
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, cvs.width, cvs.height);

      ctx.strokeStyle = "#222";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cvs.height / 2);
      ctx.lineTo(cvs.width, cvs.height / 2);
      ctx.stroke();

      if (!isListening) {
        ctx.fillStyle = "#444";
        ctx.font = "10px monospace";
        ctx.fillText("SIGNAL: OFF", 10, 28);
        animId = requestAnimationFrame(drawVisualizer);
        return;
      }

      const { raw } = audioAnalyzerRef.current.getFrequencyData();
      if (raw.length === 0) {
        animId = requestAnimationFrame(drawVisualizer);
        return;
      }

      const barWidth = (cvs.width / raw.length) * 2.5;
      let x = 0;
      for (let i = 0; i < raw.length; i++) {
        const barHeight = (raw[i] / 255) * cvs.height;
        ctx.fillStyle = `rgb(0, 166, 81)`;
        ctx.fillRect(x, cvs.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
      animId = requestAnimationFrame(drawVisualizer);
    };
    drawVisualizer();
    return () => cancelAnimationFrame(animId);
  }, [isListening, analyzer]);

  const resetAllAudio = useCallback(() => {
    audioAnalyzerRef.current.cleanup();
    plantMusicRef.current.stop();
    setIsListening(false);
    setIsPlayingFile(false);
    setIsSinging(false);
    setIsRecording(false);
    setRecordedBlob(null);
    setInputMode("none");
    setAnalyzer(null);
    if (
      reflectionRecorderRef.current &&
      reflectionRecorderRef.current.state === "recording"
    ) {
      reflectionRecorderRef.current.stop();
    }
    setReflectionBlob(null);
    setIsRecordingReflection(false);
  }, []);

  const handleAudioInputToggle = useCallback(async (
    mode: "mic" | "file" | "reflection",
  ) => {
    if (isDemoPlaying) {
      demoAudioService.stop();
      setIsDemoPlaying(false);
    }
    if (isListening) {
      audioAnalyzerRef.current.cleanup();
      setIsListening(false);
      setIsPlayingFile(false);
    }
    if (inputMode === "reflection" && mode !== "reflection") {
      setReflectionBlob(null);
      setIsRecordingReflection(false);
    }
    if (inputMode === mode && isListening) {
      setInputMode("none");
      setAnalyzer(null);
      return;
    }
    setInputMode(mode);
    if (mode === "mic" || mode === "reflection") {
      try {
        await audioAnalyzerRef.current.startMicrophone();
        setAnalyzer(audioAnalyzerRef.current);
        setIsListening(true);
      } catch (e) {
        console.error(e);
        alert("Audio input access failed.");
        setInputMode("none");
      }
    } else {
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
          fileInputRef.current.click();
        }
      }, 0);
    }
  }, [isDemoPlaying, isListening, inputMode]);

  const handleDemoToggle = useCallback((preset?: DemoPreset) => {
    if (isListening) {
      audioAnalyzerRef.current.cleanup();
      setIsListening(false);
      setIsPlayingFile(false);
    }
    if (isDemoPlaying && !preset) {
      demoAudioService.stop();
      setIsDemoPlaying(false);
      setInputMode("none");
      setAnalyzer(null);
    } else {
      if (preset) {
        setCurrentDemoPreset(preset);
        demoAudioService.setPreset(preset);
      }
      demoAudioService.start();
      setIsDemoPlaying(true);
      setInputMode("demo");
      setAnalyzer(demoAudioService);
    }
  }, [isListening, isDemoPlaying]);

  const cycleQuestion = useCallback(() => {
    const idx = Math.floor(Math.random() * REFLECTION_QUESTIONS.length);
    setReflectionQuestion(REFLECTION_QUESTIONS[idx]);
  }, []);

  const discardReflection = useCallback(() => {
    setReflectionBlob(null);
    setIsRecordingReflection(false);
  }, []);

  const toggleReflectionRecording = useCallback(async () => {
    if (isRecordingReflection) {
      if (
        reflectionRecorderRef.current &&
        reflectionRecorderRef.current.state === "recording"
      ) {
        reflectionRecorderRef.current.stop();
      }
      setIsRecordingReflection(false);
    } else {
      setReflectionBlob(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          setReflectionBlob(blob);
        };
        recorder.start();
        reflectionRecorderRef.current = recorder;
        setIsRecordingReflection(true);
        if (!isListening) {
          await audioAnalyzerRef.current.startMicrophone();
          setAnalyzer(audioAnalyzerRef.current);
          setIsListening(true);
        }
      } catch (e) {
        console.error("Reflection recording failed", e);
      }
    }
  }, [isRecordingReflection, isListening]);

  const handleSonify = useCallback(async () => {
    if (isSinging) {
      await plantMusicRef.current.stop();
      setIsSinging(false);
      setIsRecording(false);
      setRecordedBlob(null);
    } else {
      await plantMusicRef.current.play(dnaRef.current);
      plantMusicRef.current.updateBioState(bioStateRef.current);
      setIsSinging(true);
    }
  }, [isSinging]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      const blob = await plantMusicRef.current.stopRecording();
      setRecordedBlob(blob);
      setIsRecording(false);
    } else {
      setRecordedBlob(null);
      await plantMusicRef.current.startRecording();
      setIsRecording(true);
    }
  }, [isRecording]);

  const handleFileSelect = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      audioAnalyzerRef.current.cleanup();
      const file = e.target.files[0];
      await audioAnalyzerRef.current.startFile(file);
      setAnalyzer(audioAnalyzerRef.current);
      setInputMode("file");
      setIsListening(true);
      setIsPlayingFile(true);
    }
  }, []);

  const toggleFilePlayback = useCallback(() => {
    if (analyzer && inputMode === "file") {
      audioAnalyzerRef.current.togglePlayback();
      setIsPlayingFile(!isPlayingFile);
    }
  }, [analyzer, inputMode, isPlayingFile]);

  // Called by App.tsx's handleBioUpdate to forward bioState to plantMusic
  const onBioUpdate = useCallback((state: BioState) => {
    if (isSingingRef.current) {
      plantMusicRef.current.updateBioState(state);
    }
  }, []);

  // Called by App.tsx's confirmGrowth / handleDnaChange when dna changes while singing
  const playIfSinging = useCallback((newDna: PlantDNA) => {
    if (isSingingRef.current) {
      plantMusicRef.current.play(newDna);
    }
  }, []);

  return {
    analyzer,
    inputMode,
    isListening,
    isPlayingFile,
    isDemoPlaying,
    currentDemoPreset,
    isSinging,
    isRecording,
    recordedBlob,
    reflectionQuestion,
    reflectionBlob,
    isRecordingReflection,
    visualizerCanvasRef,
    fileInputRef,
    resetAllAudio,
    handleAudioInputToggle,
    handleDemoToggle,
    handleSonify,
    toggleRecording,
    handleFileSelect,
    toggleFilePlayback,
    cycleQuestion,
    discardReflection,
    toggleReflectionRecording,
    onBioUpdate,
    playIfSinging,
  };
}
