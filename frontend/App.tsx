
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, Disc, Save, RefreshCw, Leaf, Hash, Volume2, Upload, Sliders, Play, Pause, Music, Wallet, Trash2, Eye, TestTube, ArrowRight, XCircle, PlayCircle, Activity, StopCircle, Check, MessageCircle, Mic2, RefreshCcw } from 'lucide-react';
import { AudioAnalyzer } from './services/audioService';
import { PlantMusicService } from './services/plantMusicService';
import { generatePlantDNA } from './services/geminiService';
import { Web3Service } from './services/web3Service';
import PlantCanvas from './components/PlantCanvas';
import MintModal from './components/MintModal';
import SpecimenDetailModal from './components/SpecimenDetailModal';
import { PlantDNA, Specimen, AudioSource, LabState, BioState } from './types';

// Default DNA if no Gemini
const DEFAULT_DNA: PlantDNA = {
  speciesName: "Willow of Whispers",
  description: "A melancholy specimen that weeps with the bassline.",
  growthArchitecture: "weeping_willow",
  branchingFactor: 0.8,
  angleVariance: 45,
  colorPalette: ["#1a1a1a", "#0078bf", "#ff48b0"],
  leafShape: "needle",
  leafArrangement: "alternate",
  growthSpeed: 1.2,
  mood: "melancholic",
  energy: 0.3
};

const ARCHITECTURES = ["fractal_tree", "organic_vine", "radial_succulent", "fern_frond", "weeping_willow", "alien_shrub", "crystal_cactus"];

const REFLECTION_QUESTIONS = [
    "What are you holding onto that you need to let go of?",
    "Describe a moment where you felt truly at peace.",
    "What does your silence sound like today?",
    "Who do you wish you could speak to right now?",
    "What color is your current emotion?",
    "What is growing inside you that needs nourishment?",
    "If this plant could hear your secrets, what would you say?",
    "What is a memory that makes you smile?",
    "What are you afraid to say out loud?"
];

const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [labState, setLabState] = useState<LabState>('EMPTY');
  const [bioState, setBioState] = useState<BioState>({ stress: 0, energy: 0 });

  // Audio State
  const [analyzer, setAnalyzer] = useState<AudioSource | null>(null);
  const [inputMode, setInputMode] = useState<'mic' | 'file' | 'reflection' | 'none'>('none');
  const [isListening, setIsListening] = useState(false);
  const [isPlayingFile, setIsPlayingFile] = useState(false);
  
  // Reflection State
  const [reflectionQuestion, setReflectionQuestion] = useState(REFLECTION_QUESTIONS[0]);
  const [reflectionBlob, setReflectionBlob] = useState<Blob | null>(null);
  const [isRecordingReflection, setIsRecordingReflection] = useState(false);
  const reflectionRecorderRef = useRef<MediaRecorder | null>(null);
  
  // Output State (Plant Voice)
  const [isSinging, setIsSinging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  
  // Visualizer Ref
  const visualizerCanvasRef = useRef<HTMLCanvasElement>(null);

  // Services Refs
  const audioAnalyzerRef = useRef<AudioAnalyzer>(new AudioAnalyzer());
  const plantMusicRef = useRef<PlantMusicService>(new PlantMusicService());
  const web3ServiceRef = useRef<Web3Service>(new Web3Service());

  const [dna, setDna] = useState<PlantDNA>(DEFAULT_DNA);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  
  // Initialize collection from LocalStorage
  const [collection, setCollection] = useState<Specimen[]>(() => {
      try {
          const saved = localStorage.getItem('chainGarden_collection');
          return saved ? JSON.parse(saved) : [];
      } catch (e) {
          console.error("Failed to load collection", e);
          return [];
      }
  });

  const [triggerSnapshot, setTriggerSnapshot] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  
  // Web3 & Minting State
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [showMintModal, setShowMintModal] = useState(false);
  const [mintTargetSpecimen, setMintTargetSpecimen] = useState<Specimen | null>(null);
  const [isMinting, setIsMinting] = useState(false);

  // Detail Modal State
  const [selectedSpecimen, setSelectedSpecimen] = useState<Specimen | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial check for wallet
  useEffect(() => {
      const initWeb3 = async () => {
          try {
             // Silent connect attempt
             const addr = await web3ServiceRef.current.connectWallet(true); 
             if(addr) setWalletAddress(addr);
          } catch (e) {
              // Silent fail if not connected
          }
      };
      // setTimeout to allow window.ethereum to inject
      setTimeout(initWeb3, 500);
  }, []);

  // Persist collection updates
  useEffect(() => {
      try {
        localStorage.setItem('chainGarden_collection', JSON.stringify(collection));
      } catch (e) {
          console.error("Storage limit exceeded, cannot save new specimen.", e);
          alert("Storage limit reached! Please delete some specimens to save more.");
      }
  }, [collection]);

  // Visualizer Loop
  useEffect(() => {
      let animId: number;
      const drawVisualizer = () => {
          if (!visualizerCanvasRef.current) return;
          const cvs = visualizerCanvasRef.current;
          const ctx = cvs.getContext('2d');
          if (!ctx) return;

          // Clear
          ctx.clearRect(0, 0, cvs.width, cvs.height);
          ctx.fillStyle = '#111'; // Dark bg
          ctx.fillRect(0, 0, cvs.width, cvs.height);

          // Draw Baseline Grid
          ctx.strokeStyle = '#222';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, cvs.height/2);
          ctx.lineTo(cvs.width, cvs.height/2);
          ctx.stroke();

          if (!isListening) {
             ctx.fillStyle = '#444';
             ctx.font = '10px monospace';
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


  const connectWallet = async () => {
      try {
          const addr = await web3ServiceRef.current.connectWallet(false);
          setWalletAddress(addr);
          await web3ServiceRef.current.switchNetworkToSepolia();
      } catch (e: any) {
          console.error("Wallet connection error:", e);
          if (e.code === 4001) return;
          const msg = e.message || "";
          if (msg.includes("MetaMask not found") || msg.includes("extension") || msg.includes("install")) {
              const install = confirm("MetaMask Wallet not detected. Click OK to download.");
              if (install) window.open("https://metamask.io/download/", "_blank");
          } else {
              alert("Connection failed: " + msg);
          }
      }
  };

  const resetAllAudio = () => {
    audioAnalyzerRef.current.cleanup();
    plantMusicRef.current.stop();
    setIsListening(false);
    setIsPlayingFile(false);
    setIsSinging(false);
    setIsRecording(false);
    setRecordedBlob(null);
    setInputMode('none');
    setAnalyzer(null);
    
    // Clean reflection
    if(reflectionRecorderRef.current && reflectionRecorderRef.current.state === 'recording') {
        reflectionRecorderRef.current.stop();
    }
    setReflectionBlob(null);
    setIsRecordingReflection(false);
  };

  const handleAudioInputToggle = async (mode: 'mic' | 'file' | 'reflection') => {
    if (isListening) {
        audioAnalyzerRef.current.cleanup();
        setIsListening(false);
        setIsPlayingFile(false);
    }
    
    // Clean up reflection if switching away
    if (inputMode === 'reflection' && mode !== 'reflection') {
        setReflectionBlob(null);
        setIsRecordingReflection(false);
    }
    
    if (inputMode === mode && isListening) {
        setInputMode('none');
        setAnalyzer(null);
        return;
    }

    setInputMode(mode);

    if (mode === 'mic' || mode === 'reflection') {
        // Reflection uses Mic input visually as well
        try {
            await audioAnalyzerRef.current.startMicrophone();
            setAnalyzer(audioAnalyzerRef.current);
            setIsListening(true);
        } catch (e) {
            console.error(e);
            alert("Audio input access failed.");
            setInputMode('none');
        }
    } else {
         setTimeout(() => {
             if (fileInputRef.current) {
                 fileInputRef.current.value = ''; 
                 fileInputRef.current.click();
             }
         }, 0);
    }
  };

  // REFLECTION (VOICE) LOGIC
  const cycleQuestion = () => {
      const idx = Math.floor(Math.random() * REFLECTION_QUESTIONS.length);
      setReflectionQuestion(REFLECTION_QUESTIONS[idx]);
  };

  const discardReflection = () => {
      setReflectionBlob(null);
      setIsRecordingReflection(false);
  };

  const toggleReflectionRecording = async () => {
      if (isRecordingReflection) {
          // STOP
          if (reflectionRecorderRef.current && reflectionRecorderRef.current.state === 'recording') {
              reflectionRecorderRef.current.stop();
          }
          setIsRecordingReflection(false);
          // Don't stop visuals yet, let user see the plant pulsing
      } else {
          // START
          setReflectionBlob(null);
          try {
              // We need a stream for recording. 
              // AudioAnalyzer has one but it's encapsulated. Requesting a new one for simple logic.
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const recorder = new MediaRecorder(stream);
              const chunks: BlobPart[] = [];
              
              recorder.ondataavailable = (e) => chunks.push(e.data);
              recorder.onstop = () => {
                  const blob = new Blob(chunks, { type: 'audio/webm' });
                  setReflectionBlob(blob);
              };
              
              recorder.start();
              reflectionRecorderRef.current = recorder;
              setIsRecordingReflection(true);
              
              // Ensure visuals are on
              if (!isListening) {
                  await audioAnalyzerRef.current.startMicrophone();
                  setAnalyzer(audioAnalyzerRef.current);
                  setIsListening(true);
              }
              
          } catch (e) {
              console.error("Reflection recording failed", e);
          }
      }
  };


  const handleSonify = async () => {
    if (isSinging) {
        await plantMusicRef.current.stop();
        setIsSinging(false);
        setIsRecording(false);
        setRecordedBlob(null); // Clear unsaved recording
    } else {
        await plantMusicRef.current.play(dna);
        plantMusicRef.current.updateBioState(bioState);
        setIsSinging(true);
    }
  };
  
  // MUSIC RECORDING HANDLER
  const toggleRecording = async () => {
      if (isRecording) {
          const blob = await plantMusicRef.current.stopRecording();
          setRecordedBlob(blob);
          setIsRecording(false);
      } else {
          setRecordedBlob(null); // Clear previous if restarting
          await plantMusicRef.current.startRecording();
          setIsRecording(true);
      }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      audioAnalyzerRef.current.cleanup(); 
      const file = e.target.files[0];
      await audioAnalyzerRef.current.startFile(file);
      setAnalyzer(audioAnalyzerRef.current);
      setInputMode('file');
      setIsListening(true);
      setIsPlayingFile(true);
    }
  };

  const toggleFilePlayback = () => {
    if (analyzer && inputMode === 'file') {
      audioAnalyzerRef.current.togglePlayback();
      setIsPlayingFile(!isPlayingFile);
    }
  };

  const handleGenerateDNA = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const newDna = await generatePlantDNA(prompt);
      setDna(newDna);
      setIsManualMode(false); 
      setLabState('SYNTHESIZED');
    } catch (e) {
      console.error(e);
      alert("Failed to analyze vibe. Using cached seed.");
      setLabState('SYNTHESIZED');
    } finally {
      setIsGenerating(false);
    }
  };

  const confirmGrowth = () => {
      setLabState('GROWING');
      if (isSinging) {
          plantMusicRef.current.play(dna);
      }
  };

  const discardSeed = () => {
      setLabState('EMPTY');
      setPrompt("");
  };

  const handleDnaChange = (field: keyof PlantDNA, value: any) => {
    const newDna = { ...dna, [field]: value };
    setDna(newDna);
    if (isSinging) {
        plantMusicRef.current.play(newDna);
    }
  };

  const handleColorChange = (index: number, newColor: string) => {
    const updatedPalette = [...dna.colorPalette];
    updatedPalette[index] = newColor;
    handleDnaChange('colorPalette', updatedPalette);
  };

  // HELPER: BLOB TO BASE64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const triggerSaveProcess = () => {
    setTriggerSnapshot(true);
  };

  const handleSnapshotCaptured = useCallback(async (dataUrl: string) => {
    setTriggerSnapshot(false);
    
    // 1. Prepare Music Audio
    let audioString: string | undefined = undefined;
    if (recordedBlob) {
        try {
            audioString = await blobToBase64(recordedBlob);
        } catch (e) { console.error("Audio conversion failed", e); }
    }

    // 2. Prepare Reflection Audio
    let reflectionString: string | undefined = undefined;
    if (reflectionBlob) {
        try {
            reflectionString = await blobToBase64(reflectionBlob);
        } catch (e) { console.error("Reflection conversion failed", e); }
    }

    const capturedPrompt = isManualMode ? "Manual Tuning" : (prompt || "Unknown Vibe");
    const newSpecimen: Specimen = {
      id: Math.random().toString(36).substr(2, 9),
      dna: dna,
      prompt: capturedPrompt,
      timestamp: Date.now(),
      imageData: dataUrl,
      audioData: audioString,
      reflectionAudioData: reflectionString,
      reflectionQuestion: reflectionBlob ? reflectionQuestion : undefined // Save question only if audio exists
    };

    setCollection(prev => [newSpecimen, ...prev]);
    setLastSavedId(newSpecimen.id);
    setTimeout(() => setLastSavedId(null), 3000);
    
    setLabState('EMPTY');
    resetAllAudio();
    
  }, [dna, prompt, isManualMode, recordedBlob, reflectionBlob, reflectionQuestion]);

  const handleCompost = () => {
      setLabState('EMPTY');
      resetAllAudio();
      setDna(DEFAULT_DNA);
      setPrompt("");
  };

  const handleBioUpdate = (state: BioState) => {
      setBioState(state);
      if (isSinging) {
          plantMusicRef.current.updateBioState(state);
      }
  };

  const handleStartMinting = (specimen: Specimen) => {
      if (!walletAddress) {
          connectWallet();
          return;
      }
      setMintTargetSpecimen(specimen);
      setSelectedSpecimen(null); 
      setShowMintModal(true);
  };

  const confirmMint = async () => {
      if (!mintTargetSpecimen || !walletAddress) return;
      setIsMinting(true);
      try {
          const metadata = JSON.stringify(mintTargetSpecimen);
          const result = await web3ServiceRef.current.mintNFT(metadata);
          
          const updatedSpecimen = {
              ...mintTargetSpecimen,
              txHash: result.txHash,
              tokenId: result.tokenId,
              owner: walletAddress
          };
          setCollection(prev => prev.map(item => item.id === updatedSpecimen.id ? updatedSpecimen : item));
          setMintTargetSpecimen(updatedSpecimen); 
      } catch (e) {
          console.error(e);
          alert("Minting failed.");
      } finally {
          setIsMinting(false);
      }
  };

  const deleteSpecimen = (id: string) => {
      setCollection(prev => prev.filter(s => s.id !== id));
  }

  const clearCollection = () => {
      if(confirm("Burn entire local collection?")) {
          setCollection([]);
          localStorage.removeItem('chainGarden_collection');
      }
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-grain">
      
      {/* MODALS */}
      <MintModal 
         isOpen={showMintModal}
         onClose={() => setShowMintModal(false)}
         specimen={mintTargetSpecimen}
         onConfirmMint={confirmMint}
         walletAddress={walletAddress || ''}
         isMinting={isMinting}
      />

      <SpecimenDetailModal 
        specimen={selectedSpecimen}
        onClose={() => setSelectedSpecimen(null)}
        onMint={handleStartMinting}
        onDelete={deleteSpecimen}
        walletConnected={!!walletAddress}
      />

      {/* LEFT PANEL: Swappable Interface */}
      <div className="w-full md:w-1/3 lg:w-1/4 p-6 border-r-2 border-riso-black bg-riso-paper z-10 flex flex-col gap-6 overflow-y-auto h-screen custom-scrollbar transition-all duration-500">
        
        {/* Header */}
        <div className="border-b-4 border-double border-riso-black pb-4">
          <h1 className="text-4xl font-bold tracking-tighter text-riso-green uppercase break-words">
             Chain<br/>Garden
          </h1>
          <div className="flex justify-between items-end mt-2">
              <p className="text-xs font-mono text-riso-black/70">
                LAB_OS v4.2<br/>
                STATUS: {isSinging ? "BROADCASTING" : labState}
              </p>
              <div className={`w-3 h-3 rounded-full animate-pulse ${isSinging ? 'bg-riso-pink' : labState === 'GROWING' ? 'bg-riso-green' : 'bg-gray-300'}`}></div>
          </div>
        </div>

        {/* Connect Wallet */}
        <button 
            onClick={connectWallet}
            className={`w-full py-2 px-3 border-2 border-black font-bold text-xs flex items-center justify-between group transition-all
            ${walletAddress ? 'bg-riso-black text-white' : 'bg-white text-black hover:bg-riso-blue hover:text-white'}`}
        >
            <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                {walletAddress ? "WALLET LINKED" : "CONNECT WALLET"}
            </div>
            {walletAddress && (
                <span className="font-mono text-[10px] opacity-70">{web3ServiceRef.current.shortenAddress(walletAddress)}</span>
            )}
        </button>

        {/* --- DUAL MODE PANEL CONTENT --- */}
        
        {isSinging ? (
            /* VINYL / MUSIC MODE */
            <div className="flex-1 flex flex-col animate-in slide-in-from-right duration-300 space-y-6">
                
                {/* Vinyl Display */}
                <div className="w-full aspect-square bg-white border-2 border-black rounded-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative flex items-center justify-center animate-[spin_4s_linear_infinite]">
                    <div className="absolute inset-0 rounded-full border-[12px] border-riso-black/10"></div>
                    <div className="absolute inset-4 rounded-full border border-black/20"></div>
                    <div className="absolute inset-8 rounded-full border border-black/20"></div>
                    
                    {/* Label */}
                    <div className="w-24 h-24 bg-riso-pink rounded-full border-4 border-black flex flex-col items-center justify-center text-center p-2 z-10">
                         <span className="text-[8px] font-bold text-white leading-none mb-1">CHAIN RECORDS</span>
                         <span className="text-[6px] font-mono leading-none">{dna.speciesName.slice(0,15)}</span>
                    </div>
                </div>

                {/* Track Stats */}
                <div className="bg-white border-2 border-black p-4 space-y-2 font-mono text-xs shadow-md">
                     <div className="flex justify-between border-b border-black pb-1">
                         <span className="font-bold">MOOD:</span>
                         <span className="uppercase text-riso-blue">{dna.mood}</span>
                     </div>
                     <div className="flex justify-between border-b border-black pb-1">
                         <span className="font-bold">BPM:</span>
                         <span>{(60 + dna.growthSpeed * 40).toFixed(0)}</span>
                     </div>
                     <div className="flex justify-between">
                         <span className="font-bold">STRESS FX:</span>
                         <div className="w-20 h-4 bg-gray-200 border border-black">
                             <div className="h-full bg-riso-pink transition-all" style={{width: `${bioState.stress * 100}%`}}></div>
                         </div>
                     </div>
                </div>

                {/* Recording Controls */}
                <div className="mt-auto space-y-2">
                    <button 
                        onClick={toggleRecording}
                        className={`w-full py-4 font-bold border-2 border-black flex items-center justify-center gap-2 transition-all
                        ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-black hover:bg-gray-100'}`}
                    >
                        {isRecording ? <><StopCircle className="w-5 h-5"/> STOP RECORDING</> : <><Disc className="w-5 h-5"/> START RECORDING</>}
                    </button>
                    
                    {recordedBlob && (
                         <div className="flex items-center gap-2 p-2 bg-riso-green/20 border-2 border-riso-green text-xs font-bold text-riso-green animate-in fade-in">
                             <Check className="w-4 h-4" />
                             AUDIO BUFFERED. CLICK SAVE TO BIND.
                         </div>
                    )}

                    <div className="text-[10px] text-center text-gray-500">
                        Stop to buffer audio. Then click the <Save className="w-3 h-3 inline"/> Icon to save with specimen.
                    </div>
                </div>

            </div>
        ) : (
            /* LAB MODE (Synthesis + Nutrients) */
            <>
                {/* 1. SYNTHESIS */}
                <div className="space-y-4 animate-in slide-in-from-left duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TestTube className="w-5 h-5 text-riso-green" />
                      <h2 className="font-bold text-lg">SYNTHESIS</h2>
                    </div>
                    <button onClick={() => setIsManualMode(!isManualMode)} className={`p-1 border border-black ${isManualMode ? 'bg-riso-blue text-white' : 'bg-white'}`}><Sliders className="w-4 h-4" /></button>
                  </div>
                  
                  {labState === 'EMPTY' ? (
                      !isManualMode ? (
                        <>
                          <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the vibe to synthesize DNA..."
                            className="w-full h-24 p-3 font-mono text-sm bg-gray-50 border-2 border-riso-black focus:outline-none focus:ring-2 focus:ring-riso-blue resize-none"
                          />
                          <button 
                            onClick={handleGenerateDNA}
                            disabled={isGenerating || !prompt}
                            className="w-full py-3 bg-riso-black text-white font-bold border-2 border-transparent hover:bg-riso-green hover:border-black hover:text-black flex items-center justify-center gap-2"
                          >
                            {isGenerating ? <RefreshCw className="animate-spin w-4 h-4"/> : <Leaf className="w-4 h-4"/>}
                            {isGenerating ? "SYNTHESIZING..." : "INITIATE GROWTH"}
                          </button>
                        </>
                      ) : (
                        <div className="bg-white border-2 border-riso-black p-3 space-y-3 text-xs">
                           <div className="space-y-1">
                              <div className="font-bold">ARCHITECTURE</div>
                              <select value={dna.growthArchitecture} onChange={(e) => handleDnaChange('growthArchitecture', e.target.value)} className="w-full p-1 border border-black font-mono">{ARCHITECTURES.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}</select>
                           </div>
                           <div className="space-y-1">
                              <div className="font-bold">MOOD</div>
                              <select value={dna.mood} onChange={(e) => handleDnaChange('mood', e.target.value)} className="w-full p-1 border border-black font-mono">{['happy', 'melancholic', 'mysterious', 'aggressive', 'calm'].map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}</select>
                           </div>
                           <div className="space-y-1">
                                <div className="font-bold">PALETTE (STEM/LEAF/ACCENT)</div>
                                <div className="flex gap-2">
                                    {dna.colorPalette.map((color, idx) => (
                                        <input 
                                            key={idx}
                                            type="color" 
                                            value={color} 
                                            onChange={(e) => handleColorChange(idx, e.target.value)}
                                            className="h-8 flex-1 border border-black p-0 bg-transparent cursor-pointer"
                                        />
                                    ))}
                                </div>
                           </div>
                           <button onClick={() => setLabState('SYNTHESIZED')} className="w-full py-2 bg-riso-blue text-white font-bold hover:bg-riso-black transition-colors">GENERATE SEED</button>
                        </div>
                      )
                  ) : labState === 'SYNTHESIZED' ? (
                      <div className="p-4 bg-riso-yellow/20 border-2 border-riso-black space-y-4 animate-in slide-in-from-left">
                          <div className="text-center">
                              <div className="font-bold text-riso-black">DNA SEQUENCE READY</div>
                              <div className="text-xs font-mono text-gray-600">Review parameters before planting.</div>
                          </div>
                          
                          <div className="text-xs space-y-1 border-t border-b border-black py-2">
                              <div className="flex justify-between"><span>SPECIES:</span><span className="font-bold">{dna.speciesName}</span></div>
                              <div className="flex justify-between"><span>ARCH:</span><span>{dna.growthArchitecture}</span></div>
                              <div className="flex justify-between"><span>MOOD:</span><span className="uppercase text-riso-pink">{dna.mood}</span></div>
                              <div className="flex justify-between items-center pt-1">
                                <span>PALETTE:</span>
                                <div className="flex gap-1">
                                    {dna.colorPalette.map((c, i) => (
                                        <div key={i} className="w-4 h-4 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" style={{backgroundColor: c}} title={c}></div>
                                    ))}
                                </div>
                              </div>
                          </div>

                          <div className="flex gap-2">
                              <button onClick={discardSeed} className="flex-1 py-2 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold text-xs flex items-center justify-center">
                                  <XCircle className="w-4 h-4 mr-1"/> REJECT
                              </button>
                              <button onClick={confirmGrowth} className="flex-[2] py-2 bg-riso-black text-white hover:bg-riso-green font-bold text-xs flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px] transition-all">
                                  <PlayCircle className="w-4 h-4 mr-1"/> PLANT SEED
                              </button>
                          </div>
                      </div>
                  ) : (
                      <div className="p-4 bg-gray-100 border-2 border-riso-black text-center space-y-2">
                          <div className="animate-pulse font-bold text-riso-green">SPECIMEN ACTIVE</div>
                          
                          {/* DNA Stats in GROWING State */}
                          <div className="text-xs space-y-1 border-t border-b border-black py-2 text-left">
                              <div className="flex justify-between"><span>SPECIES:</span><span className="font-bold truncate w-24 text-right">{dna.speciesName}</span></div>
                              <div className="flex justify-between"><span>ARCH:</span><span>{dna.growthArchitecture.replace('_', ' ')}</span></div>
                              <div className="flex justify-between"><span>MOOD:</span><span className="uppercase text-riso-pink">{dna.mood}</span></div>
                              <div className="flex justify-between items-center pt-1">
                                <span>PALETTE:</span>
                                <div className="flex gap-1">
                                    {dna.colorPalette.map((c, i) => (
                                        <div key={i} className="w-4 h-4 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" style={{backgroundColor: c}} title={c}></div>
                                    ))}
                                </div>
                              </div>
                          </div>

                          <button 
                            onClick={handleCompost}
                            className="w-full py-2 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold text-xs flex items-center justify-center gap-2"
                          >
                              <Trash2 className="w-3 h-3"/> COMPOST (RESET)
                          </button>
                      </div>
                  )}
                </div>

                {/* 2. NUTRIENTS (SOURCE) */}
                <div className={`space-y-4 border-2 border-dashed border-riso-black p-4 bg-white transform -rotate-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${labState === 'GROWING' ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                  <input 
                     type="file" 
                     accept="audio/*" 
                     onChange={handleFileSelect}
                     ref={fileInputRef}
                     className="hidden"
                  />

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-riso-blue" />
                      <h2 className="font-bold text-lg underline decoration-wavy decoration-riso-pink">NUTRIENTS</h2>
                    </div>
                    <div className="flex gap-1 text-[10px] font-bold">
                      <button onClick={() => handleAudioInputToggle('mic')} className={`px-1 py-1 border border-black ${inputMode === 'mic' ? 'bg-riso-black text-white' : 'hover:bg-gray-100'}`}>MIC</button>
                      <button onClick={() => handleAudioInputToggle('file')} className={`px-1 py-1 border border-black ${inputMode === 'file' ? 'bg-riso-black text-white' : 'hover:bg-gray-100'}`}>FILE</button>
                      <button onClick={() => handleAudioInputToggle('reflection')} className={`px-1 py-1 border border-black ${inputMode === 'reflection' ? 'bg-riso-black text-white' : 'hover:bg-gray-100'}`}>VOICE</button>
                    </div>
                  </div>
                  
                  {inputMode === 'reflection' ? (
                      <div className="space-y-3">
                          <div className="bg-riso-yellow/30 p-3 border-2 border-riso-black relative">
                              <MessageCircle className="absolute -top-2 -right-2 bg-white border border-black p-1 w-6 h-6" />
                              <div className="text-[10px] font-bold text-gray-500 mb-1">SELF-EXPLORATION QUERY:</div>
                              <p className="font-mono text-sm font-bold leading-tight">{reflectionQuestion}</p>
                              <button onClick={cycleQuestion} className="absolute bottom-1 right-1 p-1 hover:bg-black/10 rounded-full">
                                  <RefreshCcw className="w-3 h-3"/>
                              </button>
                          </div>
                          
                          <button 
                             onClick={toggleReflectionRecording}
                             className={`w-full py-3 px-4 font-bold border-2 border-riso-black transition-all flex items-center justify-center gap-2
                             ${isRecordingReflection ? 'bg-red-500 text-white animate-pulse' : 'bg-white hover:bg-gray-100'}`}
                          >
                             {isRecordingReflection ? <><StopCircle /> STOP RECORDING</> : <><Mic2 /> HOLD TO ANSWER</>}
                          </button>

                          {reflectionBlob && !isRecordingReflection && (
                             <div className="flex gap-2 mt-2">
                                <div className="flex-1 text-center text-xs font-bold text-riso-green flex items-center justify-center gap-1 border border-riso-green bg-green-50 p-2">
                                    <Check className="w-3 h-3"/> CAPTURED
                                </div>
                                <button onClick={discardReflection} className="px-3 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors" title="Discard Recording">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          )}
                          <div className="text-[9px] text-gray-500 text-center leading-tight">
                              Your voice shapes the structure. <br/>Save specimen to keep this recording.
                          </div>
                      </div>
                  ) : (inputMode === 'mic' || inputMode === 'none') ? (
                    <>
                      <div className="text-[10px] font-mono mb-2 text-gray-500">
                         {inputMode === 'none' ? "SELECT SOURCE TO FEED PLANT" : "SOURCE CONNECTED. AWAITING SIGNAL."}
                      </div>
                      <button 
                        onClick={() => handleAudioInputToggle('mic')}
                        className={`w-full py-3 px-4 font-bold border-2 border-riso-black transition-all duration-150 flex items-center justify-center gap-2
                          ${inputMode === 'mic' && isListening
                            ? 'bg-riso-pink text-white shadow-none translate-y-1' 
                            : 'bg-riso-yellow hover:bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px]'
                          }`}
                      >
                        {inputMode === 'mic' && isListening ? <><Disc className="animate-spin" /> HALT STREAM</> : <><Mic /> OPEN MIC</>}
                      </button>
                    </>
                  ) : (
                     <div className="space-y-2">
                       <div className="text-[10px] font-mono mb-2 text-gray-500">PLAY MP3 TO STIMULATE GROWTH</div>
                       <div className="flex gap-2">
                         <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 py-2 px-2 border-2 border-riso-black bg-white hover:bg-gray-50 font-mono text-xs flex items-center justify-center gap-1"
                         >
                           <Upload className="w-4 h-4"/> {analyzer && isListening ? "REPLACE MP3" : "LOAD MP3"}
                         </button>
                         {isListening && analyzer && (
                           <button 
                             onClick={toggleFilePlayback}
                             className="w-12 border-2 border-riso-black bg-riso-yellow flex items-center justify-center hover:bg-yellow-300"
                           >
                             {isPlayingFile ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4"/>}
                           </button>
                         )}
                       </div>
                     </div>
                  )}

                  <div className="w-full h-12 bg-black border border-black mt-2">
                      <canvas ref={visualizerCanvasRef} className="w-full h-full block" width={300} height={50} />
                  </div>
                </div>
            </>
        )}
      </div>

      {/* MIDDLE/RIGHT: Canvas Area */}
      <div className="flex-1 relative bg-riso-paper flex flex-col h-screen">
        
        {/* Top Controls Toolbar */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          
          {/* 1. AUDIO MONITOR TOGGLE (Parallel Output) */}
          <button
              onClick={handleSonify}
              disabled={labState !== 'GROWING'}
              className={`p-3 border-2 border-riso-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all
              ${labState !== 'GROWING' ? 'opacity-50 cursor-not-allowed bg-gray-200' : isSinging ? 'bg-riso-pink text-white animate-pulse' : 'bg-white hover:bg-gray-50'}`}
              title="Toggle Plant Voice (Monitor)"
          >
              {isSinging ? <Activity className="w-6 h-6 animate-bounce" /> : <Music className="w-6 h-6" />}
          </button>

          {/* 2. SAVE BUTTON */}
          <div className="relative">
             <button 
                onClick={triggerSaveProcess}
                disabled={labState !== 'GROWING'}
                className={`p-3 border-2 border-riso-black shadow-[4px_4px_0px_0px_#00a651] hover:translate-y-1 hover:shadow-none transition-all group relative
                ${labState !== 'GROWING' ? 'opacity-50 cursor-not-allowed bg-gray-200' : 'bg-white'}`}
                title="Archive Specimen"
            >
                <Save className={`w-6 h-6 ${labState === 'GROWING' ? 'text-riso-black group-hover:text-riso-green' : 'text-gray-400'}`} />
            </button>
             {lastSavedId && (
                 <div className="absolute top-full mt-2 right-0 bg-riso-green text-white text-xs font-bold px-2 py-1 whitespace-nowrap border border-black animate-bounce z-50">
                     SAVED!
                 </div>
             )}
          </div>
          
           {/* 3. GALLERY BUTTON */}
           <button 
            onClick={() => setShowGallery(!showGallery)}
            className={`p-3 border-2 border-riso-black shadow-[4px_4px_0px_0px_#0078bf] hover:translate-y-1 hover:shadow-none transition-all
            ${showGallery ? 'bg-riso-blue text-white' : 'bg-white text-riso-black'}`}
            title="View Collection"
          >
            <Hash className="w-6 h-6" />
          </button>
        </div>

        {showGallery ? (
          <div className="w-full h-full px-8 pb-8 pt-24 overflow-y-auto bg-grain custom-scrollbar">
             
             <div className="flex flex-wrap justify-between items-end gap-4 mb-8 border-b-2 border-riso-green pb-2 md:pr-36">
                <div>
                    <h2 className="text-3xl font-bold text-riso-black uppercase tracking-tighter">Herbarium Gallery</h2>
                    <p className="text-xs font-mono text-gray-500">CLICK SPECIMEN FOR DETAILS & DNA</p>
                </div>
                {collection.length > 0 && (
                    <button onClick={clearCollection} className="flex items-center gap-1 text-red-500 text-xs font-bold hover:underline bg-white px-2 py-1 border border-transparent hover:border-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" /> BURN ALL
                    </button>
                )}
             </div>
             
             {collection.length === 0 && (
               <div className="text-center mt-20 opacity-50 font-mono">
                 <Eye className="w-12 h-12 mx-auto mb-4"/>
                 <p>No specimens collected yet.</p>
                 <p className="text-xs mt-2">Return to lab to generate and save.</p>
               </div>
             )}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
               {collection.map(specimen => (
                 <div 
                    key={specimen.id} 
                    onClick={() => setSelectedSpecimen(specimen)}
                    className="bg-white p-2 border-2 border-riso-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-1 hover:rotate-0 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group"
                >
                   <div className="relative overflow-hidden border border-black">
                       <img src={specimen.imageData} alt={specimen.dna.speciesName} className="w-full h-48 object-cover mix-blend-multiply" />
                   </div>
                   <div className="p-3 font-mono text-xs border-t-2 border-dashed border-gray-300 mt-2 bg-gray-50">
                     <div className="flex justify-between items-center mb-1">
                         <p className="font-bold text-sm text-riso-black truncate w-2/3">{specimen.dna.speciesName}</p>
                         {specimen.txHash ? (
                             <Hash className="w-3 h-3 text-riso-green" />
                         ) : (
                             <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                         )}
                         {specimen.audioData && <Music className="w-3 h-3 text-riso-pink ml-1" />}
                         {specimen.reflectionAudioData && <MessageCircle className="w-3 h-3 text-riso-blue ml-1" />}
                     </div>
                     <p className="text-gray-500 italic truncate">"{specimen.prompt}"</p>
                     <p className="text-riso-green mt-1 text-[10px]">{new Date(specimen.timestamp).toLocaleDateString()}</p>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        ) : (
          <div className="w-full h-full relative p-12 flex items-end justify-center">
            {/* The Stage */}
            <div className="w-full h-full border-4 border-black relative bg-white/50 backdrop-blur-sm shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)]">
               <PlantCanvas 
                 analyzer={analyzer} 
                 dna={dna} 
                 labState={labState}
                 onBioUpdate={handleBioUpdate}
                 triggerSnapshot={triggerSnapshot}
                 onSnapshot={handleSnapshotCaptured}
               />
               
               {isListening && labState === 'GROWING' && (
                 <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,166,81,0.25)_50%)] bg-[length:100%_4px]" />
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
