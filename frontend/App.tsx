
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, Disc, Save, RefreshCw, Leaf, Hash, Info, Volume2, Upload, Sliders, Play, Pause, Music, Wallet, Zap, Trash2, Eye } from 'lucide-react';
import { AudioAnalyzer } from './services/audioService';
import { PlantMusicService } from './services/plantMusicService';
import { generatePlantDNA } from './services/geminiService';
import { Web3Service } from './services/web3Service';
import PlantCanvas from './components/PlantCanvas';
import MintModal from './components/MintModal';
import SpecimenDetailModal from './components/SpecimenDetailModal';
import { PlantDNA, Specimen, AudioSource } from './types';

// Default DNA if no Gemini
const DEFAULT_DNA: PlantDNA = {
  speciesName: "Fernus Digitalis",
  description: "A common digital fern that thrives on white noise.",
  growthArchitecture: "fern_frond",
  branchingFactor: 0.85,
  angleVariance: 25,
  colorPalette: ["#00a651", "#0078bf", "#ff48b0"],
  leafShape: "fern",
  leafArrangement: "opposite",
  growthSpeed: 1.0
};

const ARCHITECTURES = ["fractal_tree", "organic_vine", "radial_succulent", "fern_frond"];
const LEAF_SHAPES = ["fern", "round", "needle", "abstract", "heart"];

const App: React.FC = () => {
  const [analyzer, setAnalyzer] = useState<AudioSource | null>(null);
  const [audioMode, setAudioMode] = useState<'mic' | 'file' | 'gen'>('mic');
  const [isListening, setIsListening] = useState(false);
  const [isPlayingFile, setIsPlayingFile] = useState(false);
  
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
      localStorage.setItem('chainGarden_collection', JSON.stringify(collection));
  }, [collection]);

  const connectWallet = async () => {
      try {
          const addr = await web3ServiceRef.current.connectWallet(false);
          setWalletAddress(addr);
          await web3ServiceRef.current.switchNetworkToSepolia();
      } catch (e: any) {
          console.error("Wallet connection error:", e);
          
          // Don't alert if user cancelled (4001)
          if (e.code === 4001) return;

          const msg = e.message || "";
          
          if (msg.includes("MetaMask not found") || msg.includes("extension") || msg.includes("install")) {
              const install = confirm(
                  "MetaMask Wallet not detected.\n\nIF YOU JUST INSTALLED IT: Please REFRESH the page (F5) to activate it.\n\nOtherwise, click OK to download."
              );
              if (install) {
                  window.open("https://metamask.io/download/", "_blank");
              }
          } else {
              alert("Connection failed: " + msg);
          }
      }
  };

  // Stop everything helper
  const stopAllAudio = () => {
    audioAnalyzerRef.current.cleanup();
    plantMusicRef.current.stop();
    setIsListening(false);
    setIsPlayingFile(false);
    setAnalyzer(null);
  };

  // Initialize Audio Input (Mic/File)
  const handleAudioInputToggle = async () => {
    // If currently generating music, stop it
    if (audioMode === 'gen' && isListening) {
        stopAllAudio();
        setAudioMode('mic'); // reset default
        return;
    }

    if (isListening && (audioMode === 'mic' || audioMode === 'file')) {
      stopAllAudio();
    } else {
      // Start
      try {
        if (audioMode === 'mic') {
          await audioAnalyzerRef.current.startMicrophone();
          setAnalyzer(audioAnalyzerRef.current);
          setIsListening(true);
        } else {
           // Trigger file input if no file loaded
           if (fileInputRef.current && fileInputRef.current.files?.length) {
              await audioAnalyzerRef.current.startFile(fileInputRef.current.files[0]);
              setAnalyzer(audioAnalyzerRef.current);
              setIsListening(true);
              setIsPlayingFile(true);
           } else {
             fileInputRef.current?.click();
           }
        }
      } catch (e) {
        console.error(e);
        alert("Audio access failed.");
      }
    }
  };

  // Handle Plant Music Generation
  const handleSonify = () => {
    if (audioMode === 'gen' && isListening) {
        stopAllAudio();
        setAudioMode('mic'); // reset
    } else {
        stopAllAudio();
        setAudioMode('gen');
        plantMusicRef.current.play(dna);
        setAnalyzer(plantMusicRef.current);
        setIsListening(true);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      stopAllAudio();
      setAudioMode('file');
      const file = e.target.files[0];
      await audioAnalyzerRef.current.startFile(file);
      setAnalyzer(audioAnalyzerRef.current);
      setIsListening(true);
      setIsPlayingFile(true);
    }
  };

  const toggleFilePlayback = () => {
    if (analyzer && audioMode === 'file') {
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
      
      // If playing music, restart with new DNA
      if (audioMode === 'gen' && isListening) {
          plantMusicRef.current.play(newDna);
      }

    } catch (e: any) {
      console.error(e);
      const errorMsg = e?.message || "Failed to analyze vibe";
      if (errorMsg.includes("API key") || errorMsg.includes("GEMINI_API_KEY")) {
        alert(`⚠️ ${errorMsg}\n\nPlease check ENV_SETUP.md for configuration instructions.`);
      } else {
        alert(`Failed to analyze vibe: ${errorMsg}\n\nUsing cached seed.`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDnaChange = (field: keyof PlantDNA, value: any) => {
    const newDna = { ...dna, [field]: value };
    setDna(newDna);
    // Real-time music update
    if (audioMode === 'gen' && isListening) {
        plantMusicRef.current.play(newDna);
    }
  };

  const handleColorChange = (index: number, color: string) => {
    const newPalette = [...dna.colorPalette];
    newPalette[index] = color;
    setDna(prev => ({ ...prev, colorPalette: newPalette }));
  };

  // 1. TRIGGER SAVE (Snapshot)
  const triggerSaveProcess = () => {
    setTriggerSnapshot(true);
  };

  // 2. HANDLE SNAPSHOT & SAVE LOCALLY
  const handleSnapshotCaptured = useCallback((dataUrl: string) => {
    setTriggerSnapshot(false);
    
    // NOTE: We capture the current 'prompt' state here.
    const capturedPrompt = isManualMode ? "Manual Tuning" : (prompt || "Unknown Vibe");

    const newSpecimen: Specimen = {
      id: Math.random().toString(36).substr(2, 9),
      dna: dna,
      prompt: capturedPrompt,
      timestamp: Date.now(),
      imageData: dataUrl
    };

    setCollection(prev => [newSpecimen, ...prev]);
    
    // Visual Feedback
    setLastSavedId(newSpecimen.id);
    setTimeout(() => setLastSavedId(null), 3000);
    
  }, [dna, prompt, isManualMode]);

  // 3. START MINTING (From Detail Modal)
  const handleStartMinting = (specimen: Specimen) => {
      if (!walletAddress) {
          connectWallet(); // Try connecting if not
          return;
      }
      setMintTargetSpecimen(specimen);
      // Close detail modal, open mint modal
      setSelectedSpecimen(null); 
      setShowMintModal(true);
  };

  // 4. CONFIRM MINT (In Mint Modal)
  const confirmMint = async () => {
      if (!mintTargetSpecimen || !walletAddress) return;
      
      setIsMinting(true);
      try {
          // 1. "Upload" Metadata (Simulated)
          const metadata = JSON.stringify(mintTargetSpecimen);
          // 2. Mint
          const result = await web3ServiceRef.current.mintNFT(metadata);
          
          // 3. Update Collection with Result
          const updatedSpecimen = {
              ...mintTargetSpecimen,
              txHash: result.txHash,
              tokenId: result.tokenId,
              owner: walletAddress
          };
          
          setCollection(prev => prev.map(item => item.id === updatedSpecimen.id ? updatedSpecimen : item));
          setMintTargetSpecimen(updatedSpecimen); // Update modal view
          
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
      if(confirm("Burn entire local collection? This cannot be undone.")) {
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

      {/* LEFT PANEL: Controls & Data (Zine Style) */}
      <div className="w-full md:w-1/3 lg:w-1/4 p-6 border-r-2 border-riso-black bg-riso-paper z-10 flex flex-col gap-6 overflow-y-auto h-screen custom-scrollbar">
        
        {/* Header */}
        <div className="border-b-4 border-double border-riso-black pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter text-riso-green uppercase break-words">
                Chain<br/>Garden
            </h1>
            <p className="text-xs mt-2 font-mono text-riso-black/70">
                WEB3 BOTANICAL GENERATOR<br/>
                v3.2 -- SEPOLIA
            </p>
          </div>
        </div>

        {/* Connect Wallet Button */}
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
            {!walletAddress && <div className="w-2 h-2 bg-red-500 rounded-full group-hover:bg-white"/>}
        </button>

        {/* Audio Input Section */}
        <div className="space-y-4 border-2 border-dashed border-riso-black p-4 bg-white transform -rotate-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-riso-blue" />
              <h2 className="font-bold text-lg underline decoration-wavy decoration-riso-pink">SOURCE</h2>
            </div>
            <div className="flex gap-1 text-xs font-bold">
              <button 
                onClick={() => { if(audioMode !== 'mic') { stopAllAudio(); setAudioMode('mic'); } }}
                className={`px-2 py-1 border border-black ${audioMode === 'mic' ? 'bg-riso-black text-white' : 'hover:bg-gray-100'}`}
              >
                MIC
              </button>
              <button 
                onClick={() => { if(audioMode !== 'file') { stopAllAudio(); setAudioMode('file'); } }}
                className={`px-2 py-1 border border-black ${audioMode === 'file' ? 'bg-riso-black text-white' : 'hover:bg-gray-100'}`}
              >
                FILE
              </button>
            </div>
          </div>
          
          {audioMode === 'mic' ? (
            <button 
              onClick={handleAudioInputToggle}
              className={`w-full py-3 px-4 font-bold border-2 border-riso-black transition-all duration-150 flex items-center justify-center gap-2
                ${isListening 
                  ? 'bg-riso-pink text-white shadow-none translate-y-1' 
                  : 'bg-riso-yellow hover:bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px]'
                }`}
            >
              {isListening ? <><Disc className="animate-spin" /> HALT STREAM</> : <><Mic /> OPEN MIC</>}
            </button>
          ) : (
             <div className="space-y-2">
               <input 
                 type="file" 
                 accept="audio/*" 
                 onChange={handleFileSelect}
                 ref={fileInputRef}
                 className="hidden"
               />
               <div className="flex gap-2">
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-2 border-2 border-riso-black bg-white hover:bg-gray-50 font-mono text-xs flex items-center justify-center gap-1"
                 >
                   <Upload className="w-4 h-4"/> LOAD MP3
                 </button>
                 {isListening && (
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
          
          <p className="text-[10px] leading-tight text-justify">
            CAUTION: Sensitive to sonic frequencies. Bass stimulates structural growth. Treble encourages foliation.
          </p>
        </div>

        {/* Seed Generation / Tuning Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-riso-green" />
              <h2 className="font-bold text-lg">SEED DNA</h2>
            </div>
            <button 
              onClick={() => setIsManualMode(!isManualMode)}
              className={`p-1 border border-black ${isManualMode ? 'bg-riso-blue text-white' : 'bg-white'}`}
              title="Manual Tuning"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
          
          {!isManualMode ? (
            <>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe vibe (e.g., 'Techno spikes', 'Jazz curves')"
                className="w-full h-24 p-3 font-mono text-sm bg-gray-50 border-2 border-riso-black focus:outline-none focus:ring-2 focus:ring-riso-blue resize-none"
              />
              <button 
                onClick={handleGenerateDNA}
                disabled={isGenerating || !prompt}
                className="w-full py-2 bg-riso-black text-white font-mono hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? <RefreshCw className="animate-spin w-4 h-4"/> : <Leaf className="w-4 h-4"/>}
                {isGenerating ? "SYNTHESIZING..." : "GENERATE FROM VIBE"}
              </button>
            </>
          ) : (
            <div className="bg-white border-2 border-riso-black p-3 space-y-3 text-xs">
               <div>
                 <label className="block font-bold mb-1">ARCHITECTURE</label>
                 <select 
                    value={dna.growthArchitecture} 
                    onChange={(e) => handleDnaChange('growthArchitecture', e.target.value)}
                    className="w-full p-1 border border-gray-300 font-mono"
                 >
                   {ARCHITECTURES.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
                 </select>
               </div>
               <div>
                 <label className="block font-bold mb-1">LEAF SHAPE</label>
                 <select 
                    value={dna.leafShape} 
                    onChange={(e) => handleDnaChange('leafShape', e.target.value)}
                    className="w-full p-1 border border-gray-300 font-mono"
                 >
                   {LEAF_SHAPES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                 </select>
               </div>
               <div>
                 <label className="block font-bold mb-1">PALETTE</label>
                 <div className="flex gap-2">
                   {dna.colorPalette.map((c, i) => (
                     <input 
                        key={i} 
                        type="color" 
                        value={c} 
                        onChange={(e) => handleColorChange(i, e.target.value)}
                        className="w-full h-8 p-0 border-0"
                     />
                   ))}
                 </div>
               </div>
               <div>
                  <label className="block font-bold mb-1">GROWTH SPEED: {dna.growthSpeed.toFixed(1)}</label>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="3.0" 
                    step="0.1" 
                    value={dna.growthSpeed} 
                    onChange={(e) => handleDnaChange('growthSpeed', parseFloat(e.target.value))}
                    className="w-full accent-riso-green"
                  />
               </div>
            </div>
          )}
        </div>

        {/* Current Specimen Stats */}
        <div className="mt-auto border-t-2 border-riso-black pt-4 font-mono text-xs space-y-2">
          <div className="flex justify-between">
            <span>SPECIES:</span>
            <span className="font-bold text-riso-blue text-right w-1/2 truncate">{dna.speciesName}</span>
          </div>
          <div className="flex justify-between">
            <span>ARCH:</span>
            <span className="uppercase">{dna.growthArchitecture.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span>LEAF:</span>
            <span>{dna.leafShape.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* MIDDLE/RIGHT: Canvas Area */}
      <div className="flex-1 relative bg-riso-paper flex flex-col h-screen">
        
        {/* Top Controls */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <div className="relative">
             <button 
                onClick={triggerSaveProcess}
                className="p-3 bg-white border-2 border-riso-black shadow-[4px_4px_0px_0px_#00a651] hover:translate-y-1 hover:shadow-none transition-all group relative"
                title="Save Specimen to Gallery"
            >
                {/* This is the SAVE button (Floppy Disk), distinct from Zap */}
                <Save className="w-6 h-6 text-riso-black group-hover:text-riso-green fill-current" />
            </button>
             {lastSavedId && (
                 <div className="absolute top-full mt-2 right-0 bg-riso-green text-white text-xs font-bold px-2 py-1 whitespace-nowrap border border-black animate-bounce z-50">
                     SAVED TO GALLERY!
                 </div>
             )}
          </div>
          
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
          /* Decreased top padding to pt-24 (was pt-36) to lift the gallery. Added pr-32 to header to avoid buttons. */
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
                 <Info className="w-12 h-12 mx-auto mb-4"/>
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
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                           <Eye className="text-white opacity-0 group-hover:opacity-100 w-8 h-8 drop-shadow-md" />
                       </div>
                   </div>
                   <div className="p-3 font-mono text-xs border-t-2 border-dashed border-gray-300 mt-2 bg-gray-50">
                     <div className="flex justify-between items-center mb-1">
                         <p className="font-bold text-sm text-riso-black truncate w-2/3">{specimen.dna.speciesName}</p>
                         {specimen.txHash ? (
                             <Hash className="w-3 h-3 text-riso-green" />
                         ) : (
                             <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                         )}
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
                 isPlaying={isListening} 
                 triggerSnapshot={triggerSnapshot}
                 onSnapshot={handleSnapshotCaptured}
               />
               
               {/* Decorative "Scanning" lines */}
               {isListening && (
                 <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,166,81,0.25)_50%)] bg-[length:100%_4px]" />
               )}
            </div>
            
            {/* SONIFY BUTTON (Floating) */}
             <div className="absolute bottom-16 right-16 z-40">
                 <button
                    onClick={handleSonify}
                    className={`group relative p-4 border-2 border-riso-black bg-white hover:bg-riso-green hover:text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex items-center gap-3`}
                 >
                    {audioMode === 'gen' && isListening ? (
                        <>
                           <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                           <span className="font-bold font-mono text-xl">HALT SONIFICATION</span>
                        </>
                    ) : (
                        <>
                           <Music className="w-8 h-8" />
                           <div className="text-left">
                             <span className="block text-xs font-bold">HEAR THE DATA</span>
                             <span className="block font-bold font-mono text-xl">SONIFY PLANT</span>
                           </div>
                        </>
                    )}
                 </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
