import React, { useState, useCallback, useRef } from "react";
import {
  Mic,
  Disc,
  Save,
  RefreshCw,
  Leaf,
  Hash,
  Volume2,
  Upload,
  Sliders,
  Play,
  Pause,
  Music,
  Wallet,
  Trash2,
  Eye,
  TestTube,
  ArrowRight,
  XCircle,
  PlayCircle,
  Activity,
  StopCircle,
  Check,
  MessageCircle,
  Mic2,
  RefreshCcw,
  Store,
  ShoppingCart,
} from "lucide-react";
import { DEMO_PRESETS, DemoPreset } from "./services/demoAudioService";
import { aiService } from "./services/ai";
import PlantCanvas from "./components/PlantCanvas";
import MintModal from "./components/MintModal";
import SpecimenDetailModal from "./components/SpecimenDetailModal";
import Marketplace from "./components/Marketplace";
import PurchaseModal from "./components/PurchaseModal";
import GuideModal from "./components/GuideModal";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { PlantDNA, Specimen, LabState, BioState } from "./types";
import { HelpCircle, ChevronRight, Languages } from "lucide-react";
import { useWallet } from "./hooks/useWallet";
import { useAudio } from "./hooks/useAudio";
import { useMarket } from "./hooks/useMarket";
import { useSpecimenCollection } from "./hooks/useSpecimenCollection";

// Default DNA if no Gemini
const DEFAULT_DNA: PlantDNA = {
  speciesName: "Alien Shrub",
  description: "An otherworldly specimen with glitched growth patterns and unexpected forms.",
  growthArchitecture: "alien_shrub",
  branchingFactor: 0.8,
  angleVariance: 45,
  colorPalette: ["#1a1a1a", "#F566B8", "#93D133"],
  leafShape: "needle",
  leafArrangement: "alternate",
  growthSpeed: 1.2,
  mood: "melancholic",
  energy: 0.3,
};

const ARCHITECTURES = [
  "fractal_tree",
  "organic_vine",
  "radial_succulent",
  "fern_frond",
  "weeping_willow",
  "alien_shrub",
  "crystal_cactus",
  "data_blossom",
];

const AppContent: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  // --- Lab State (cannot be归入 any single hook) ---
  const [labState, setLabState] = useState<LabState>("EMPTY");
  const [bioState, setBioState] = useState<BioState>({ stress: 0, energy: 0 });
  const [dna, setDna] = useState<PlantDNA>(DEFAULT_DNA);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);

  // --- Image Upload State (for multimodal AI) ---
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // --- UI State ---
  const [selectedSpecimen, setSelectedSpecimen] = useState<Specimen | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // --- Domain Hooks ---
  const wallet = useWallet();
  const audio = useAudio(dna, bioState);
  const spec = useSpecimenCollection({
    walletAddress: wallet.walletAddress,
    walletInitialized: wallet.walletInitialized,
    web3Service: wallet.web3Service,
    connectWallet: wallet.connectWallet,
  });
  const market = useMarket({ walletAddress: wallet.walletAddress });

  // --- Cross-domain functions (kept in App.tsx) ---

  const handleBioUpdate = (state: BioState) => {
    setBioState(state);
    audio.onBioUpdate(state);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSnapshotCaptured = useCallback(
    async (dataUrl: string) => {
      spec.setTriggerSnapshot(false);

      // 1. Prepare Music Audio
      let audioString: string | undefined = undefined;
      if (audio.recordedBlob) {
        try {
          audioString = await blobToBase64(audio.recordedBlob);
        } catch (e) {
          console.error("Audio conversion failed", e);
        }
      }

      // 2. Prepare Reflection Audio
      let reflectionString: string | undefined = undefined;
      if (audio.reflectionBlob) {
        try {
          reflectionString = await blobToBase64(audio.reflectionBlob);
        } catch (e) {
          console.error("Reflection conversion failed", e);
        }
      }

      const capturedPrompt = isManualMode
        ? "Manual Tuning"
        : prompt || "Unknown Vibe";
      const newSpecimen: Specimen = {
        id: Math.random().toString(36).substr(2, 9),
        dna: dna,
        prompt: capturedPrompt,
        timestamp: Date.now(),
        imageData: dataUrl,
        audioData: audioString,
        reflectionAudioData: reflectionString,
        reflectionQuestion: audio.reflectionBlob ? audio.reflectionQuestion : undefined,
      };

      try {
        spec.saveAndReload(newSpecimen);
      } catch (e: any) {
        alert(e.message || "Failed to save specimen");
        return;
      }

      setLabState("EMPTY");
      audio.resetAllAudio();
    },
    [
      dna,
      prompt,
      isManualMode,
      audio.recordedBlob,
      audio.reflectionBlob,
      audio.reflectionQuestion,
      audio.resetAllAudio,
      spec.saveAndReload,
      spec.setTriggerSnapshot,
    ],
  );

  const handleGenerateDNA = async () => {
    if (!prompt.trim() && !uploadedImage) return;
    setIsGenerating(true);
    try {
      let newDna: PlantDNA;
      if (uploadedImage) {
        newDna = await aiService.generatePlantDNAFromImage(
          uploadedImage,
          prompt.trim() || undefined,
        );
      } else {
        newDna = await aiService.generatePlantDNA(prompt);
      }
      setDna(newDna);
      setIsManualMode(false);
      setLabState("SYNTHESIZED");
      clearImage();
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      alert(`AI 分析失败：${msg}`);
      setLabState("SYNTHESIZED");
    } finally {
      setIsGenerating(false);
    }
  };

  const confirmGrowth = () => {
    setLabState("GROWING");
    audio.playIfSinging(dna);
  };

  const discardSeed = () => {
    setLabState("EMPTY");
    setPrompt("");
  };

  const handleDnaChange = (field: keyof PlantDNA, value: any) => {
    const newDna = { ...dna, [field]: value };
    setDna(newDna);
    audio.playIfSinging(newDna);
  };

  const handleColorChange = (index: number, newColor: string) => {
    const updatedPalette = [...dna.colorPalette];
    updatedPalette[index] = newColor;
    handleDnaChange("colorPalette", updatedPalette);
  };

  const handleCompost = () => {
    setLabState("EMPTY");
    audio.resetAllAudio();
    setDna(DEFAULT_DNA);
    setPrompt("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file");
      return;
    }
    setUploadedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const triggerSaveProcess = () => {
    spec.setTriggerSnapshot(true);
  };

  // Wrap handleStartMinting to also clear the detail modal
  const handleStartMinting = useCallback((specimen: Specimen) => {
    setSelectedSpecimen(null);
    spec.handleStartMinting(specimen);
  }, [spec.handleStartMinting]);

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-grain">
      {/* MODALS */}
      <MintModal
        isOpen={spec.showMintModal}
        onClose={() => spec.setShowMintModal(false)}
        specimen={spec.mintTargetSpecimen}
        onConfirmMint={spec.confirmMint}
        walletAddress={wallet.walletAddress || ""}
        mintPhase={spec.mintPhase}
      />

      <SpecimenDetailModal
        specimen={selectedSpecimen}
        onClose={() => setSelectedSpecimen(null)}
        onMint={handleStartMinting}
        onDelete={spec.deleteSpecimen}
        walletConnected={!!wallet.walletAddress}
      />

      <PurchaseModal
        isOpen={market.showPurchaseModal}
        onClose={() => { market.setShowPurchaseModal(false); market.setSelectedListing(null); }}
        listing={market.selectedListing}
        walletAddress={wallet.walletAddress}
        onConnectWallet={wallet.connectWallet}
        onPurchase={market.handlePurchase}
      />

      <GuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />

      {/* LEFT PANEL: Swappable Interface */}
      <div className="w-full md:w-1/3 lg:w-1/4 p-6 border-r-2 border-riso-black bg-riso-paper z-10 flex flex-col gap-6 overflow-y-auto h-screen custom-scrollbar transition-all duration-500">
        {/* Header */}
        <div className="border-b-4 border-double border-riso-black pb-4">
          <h1 className="text-4xl font-bold tracking-tighter text-riso-green uppercase break-words">
            {t("app_title").split(" ").map((word, i) => (
              <React.Fragment key={i}>
                {word}
                <br />
              </React.Fragment>
            ))}
          </h1>
          <div className="flex justify-between items-end mt-2">
            <p className="text-xs font-mono text-riso-black/70 uppercase">
              LAB_OS v4.2
              <br />
              {t("lab_status")}: {audio.isSinging ? t("status_broadcasting") : t(`status_${labState.toLowerCase()}` as any)}
            </p>
            <div className={`w-3 h-3 rounded-full animate-pulse ${audio.isSinging ? "bg-riso-pink" : labState === "GROWING" ? "bg-riso-green" : "bg-gray-300"}`}></div>
          </div>

          {/* Quick Help & Language Switch */}
          <div className="mt-4 flex flex-col gap-2">
            <button onClick={() => setShowGuide(true)} className="flex items-center gap-1 text-[10px] font-mono text-riso-blue hover:underline group">
              <HelpCircle className="w-3 h-3 group-hover:animate-bounce" />
              {t("need_guide")}
            </button>
            <div className="flex items-center gap-2">
              <Languages className="w-3 h-3 text-riso-black/50" />
              <button onClick={() => setLanguage(language === "zh" ? "en" : "zh")} className="text-[10px] font-mono text-riso-black/50 hover:text-riso-black border border-riso-black/20 px-1.5 py-0.5 hover:bg-riso-black/5 transition-all">
                {language === "zh" ? "ENGLISH" : "中文"}
              </button>
            </div>
          </div>
        </div>

        {/* Connect/Disconnect Wallet */}
        <button
          onClick={wallet.handleWalletButtonClick}
          className={`w-full py-2 px-3 border-2 border-black font-bold text-xs flex items-center justify-between group transition-all
            ${wallet.walletAddress ? "bg-riso-black text-white" : "bg-white text-black hover:bg-riso-blue hover:text-white"}`}
          title={wallet.walletAddress ? t("reconnect_wallet_msg", { address: wallet.walletAddress }) : t("connect_wallet")}
        >
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            {wallet.walletAddress ? t("wallet_linked") : t("connect_wallet")}
          </div>
          {wallet.walletAddress && (
            <span className="font-mono text-[10px] opacity-70">
              {wallet.web3Service.shortenAddress(wallet.walletAddress)}
            </span>
          )}
        </button>

        {audio.isSinging ? (
          /* VINYL / MUSIC MODE */
          <div className="flex-1 flex flex-col animate-in slide-in-from-right duration-300 space-y-6">
            <div className="w-full aspect-square bg-white border-2 border-black rounded-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative flex items-center justify-center animate-[spin_4s_linear_infinite]">
              <div className="absolute inset-0 rounded-full border-[12px] border-riso-black/10"></div>
              <div className="absolute inset-4 rounded-full border border-black/20"></div>
              <div className="absolute inset-8 rounded-full border border-black/20"></div>
              <div className="w-24 h-24 bg-riso-pink rounded-full border-4 border-black flex flex-col items-center justify-center text-center p-2 z-10">
                <span className="text-[8px] font-bold text-white leading-none mb-1">CHAIN RECORDS</span>
                <span className="text-[6px] font-mono leading-none">{dna.speciesName.slice(0, 15)}</span>
              </div>
            </div>

            <div className="bg-white border-2 border-black p-4 space-y-2 font-mono text-xs shadow-md uppercase">
              <div className="flex justify-between border-b border-black pb-1">
                <span className="font-bold">{t("mood")}:</span>
                <span className="text-riso-blue">{t(dna.mood as any) || dna.mood}</span>
              </div>
              <div className="flex justify-between border-b border-black pb-1">
                <span className="font-bold">BPM:</span>
                <span>{(60 + dna.growthSpeed * 40).toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">{t("biology_stress")}:</span>
                <div className="w-20 h-4 bg-gray-200 border border-black">
                  <div className="h-full bg-riso-pink transition-all" style={{ width: `${bioState.stress * 100}%` }}></div>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-2">
              <button
                onClick={audio.toggleRecording}
                className={`w-full py-4 font-bold border-2 border-black flex items-center justify-center gap-2 transition-all uppercase
                        ${audio.isRecording ? "bg-red-500 text-white animate-pulse" : "bg-white text-black hover:bg-gray-100"}`}
              >
                {audio.isRecording ? (
                  <><StopCircle className="w-5 h-5" /> {t("record_stop")}</>
                ) : (
                  <><Disc className="w-5 h-5" /> {t("record_start")}</>
                )}
              </button>
              {audio.recordedBlob && (
                <div className="flex items-center gap-2 p-2 bg-riso-green/20 border-2 border-riso-green text-xs font-bold text-riso-green animate-in fade-in uppercase">
                  <Check className="w-4 h-4" /> {t("record_buffered")}
                </div>
              )}
              <div className="text-[10px] text-center text-gray-500 uppercase">
                {t("record_hint")}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4 animate-in slide-in-from-left duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-riso-green" />
                  <h2 className="font-bold text-lg">{t("synthesis_title")}</h2>
                </div>
                <button onClick={() => setIsManualMode(!isManualMode)} className={`p-1 border border-black ${isManualMode ? "bg-riso-blue text-white" : "bg-white"}`}>
                  <Sliders className="w-4 h-4" />
                </button>
              </div>

              {labState === "EMPTY" ? (
                !isManualMode ? (
                  <>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={t("prompt_placeholder")}
                      className="w-full h-24 p-3 font-mono text-sm bg-gray-50 border-2 border-riso-black focus:outline-none focus:ring-2 focus:ring-riso-blue resize-none"
                    />
                    <div className="space-y-2">
                      <div className="text-xs font-mono text-gray-600 text-center uppercase">{t("or_upload_image")}</div>
                      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      <button onClick={() => imageInputRef.current?.click()} className="w-full py-2 px-3 border-2 border-riso-black bg-white hover:bg-riso-blue hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors uppercase">
                        <Upload className="w-4 h-4" />
                        {uploadedImage ? t("change_image") : t("upload_image")}
                      </button>
                      {imagePreview && (
                        <div className="relative border-2 border-riso-black p-2 bg-white">
                          <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover" />
                          <button onClick={clearImage} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleGenerateDNA}
                      disabled={isGenerating || (!prompt && !uploadedImage)}
                      className={`w-full py-3 bg-riso-black text-white font-bold border-2 border-transparent hover:bg-riso-green hover:border-black hover:text-black flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all
                        ${(prompt.trim() || uploadedImage) && !isGenerating ? "ring-4 ring-riso-blue ring-opacity-50 animate-pulse" : ""}`}
                    >
                      {isGenerating ? <RefreshCw className="animate-spin w-4 h-4" /> : <Leaf className="w-4 h-4" />}
                      {isGenerating ? t("synthesizing") : t("initiate_growth")}
                    </button>
                  </>
                ) : (
                  <div className="bg-white border-2 border-riso-black p-3 space-y-3 text-xs">
                    <div className="space-y-1">
                      <div className="font-bold uppercase">{t("architecture")}</div>
                      <select value={dna.growthArchitecture} onChange={(e) => handleDnaChange("growthArchitecture", e.target.value)} className="w-full p-1 border border-black font-mono">
                        {ARCHITECTURES.map((a) => (<option key={a} value={a}>{a.toUpperCase()}</option>))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold uppercase">{t("mood")}</div>
                      <select value={dna.mood} onChange={(e) => handleDnaChange("mood", e.target.value)} className="w-full p-1 border border-black font-mono">
                        {["happy", "melancholic", "mysterious", "aggressive", "calm"].map((m) => (<option key={m} value={m}>{m.toUpperCase()}</option>))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold uppercase">{t("palette")}</div>
                      <div className="flex gap-2">
                        {dna.colorPalette.map((color, idx) => (
                          <input key={idx} type="color" value={color} onChange={(e) => handleColorChange(idx, e.target.value)} className="h-8 flex-1 border border-black p-0 bg-transparent cursor-pointer" />
                        ))}
                      </div>
                    </div>
                    <button onClick={() => setLabState("SYNTHESIZED")} className="w-full py-2 bg-riso-blue text-white font-bold hover:bg-riso-black transition-colors uppercase">
                      {t("generate_seed")}
                    </button>
                  </div>
                )
              ) : labState === "SYNTHESIZED" ? (
                <div className="p-4 bg-riso-yellow/20 border-2 border-riso-black space-y-4 animate-in slide-in-from-left">
                  <div className="text-center">
                    <div className="font-bold text-riso-black uppercase">{t("dna_ready")}</div>
                    <div className="text-xs font-mono text-gray-600">{t("review_params")}</div>
                  </div>
                  <div className="text-xs space-y-1 border-t border-b border-black py-2">
                    <div className="flex justify-between">
                      <span className="uppercase">{t("species")}:</span>
                      <span className="font-bold">{dna.speciesName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="uppercase">{t("arch")}:</span>
                      <span>{dna.growthArchitecture}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="uppercase">{t("mood")}:</span>
                      <span className="uppercase text-riso-pink">{dna.mood}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="uppercase">{t("palette")}:</span>
                      <div className="flex gap-1">
                        {dna.colorPalette.map((c, i) => (
                          <div key={i} className="w-4 h-4 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" style={{ backgroundColor: c }} title={c}></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={discardSeed} className="flex-1 py-2 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold text-xs flex items-center justify-center uppercase">
                      <XCircle className="w-4 h-4 mr-1" /> {t("reject")}
                    </button>
                    <button onClick={confirmGrowth} className="flex-[2] py-2 bg-riso-black text-white hover:bg-riso-green font-bold text-xs flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px] transition-all uppercase">
                      <PlayCircle className="w-4 h-4 mr-1" /> {t("plant_seed")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-100 border-2 border-riso-black text-center space-y-2">
                  <div className="animate-pulse font-bold text-riso-green uppercase">{t("specimen_active")}</div>
                  <div className="text-xs space-y-1 border-t border-b border-black py-2 text-left uppercase">
                    <div className="flex justify-between"><span>{t("species")}:</span><span className="font-bold truncate w-24 text-right">{dna.speciesName}</span></div>
                    <div className="flex justify-between"><span>{t("arch")}:</span><span>{dna.growthArchitecture.replace("_", " ")}</span></div>
                    <div className="flex justify-between"><span>{t("mood")}:</span><span className="uppercase text-riso-pink">{dna.mood}</span></div>
                    <div className="flex justify-between items-center pt-1"><span>{t("palette")}:</span><div className="flex gap-1">{dna.colorPalette.map((c, i) => (<div key={i} className="w-4 h-4 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" style={{ backgroundColor: c }}></div>))}</div></div>
                  </div>
                  <button onClick={handleCompost} className="w-full py-2 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold text-xs flex items-center justify-center gap-2 uppercase">
                    <Trash2 className="w-3 h-3" /> {t("compost")}
                  </button>
                </div>
              )}
            </div>

            <div className={`space-y-4 border-2 border-dashed border-riso-black p-4 bg-white transform -rotate-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${labState === "GROWING" ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
              <input type="file" accept="audio/*" onChange={audio.handleFileSelect} ref={audio.fileInputRef} className="hidden" />
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-riso-blue" />
                  <h2 className="font-bold text-lg underline decoration-wavy decoration-riso-pink uppercase">{t("nutrients_title")}</h2>
                </div>
                <div className="flex gap-1 text-[10px] font-bold uppercase">
                  <button onClick={() => audio.handleDemoToggle()} className={`px-1 py-1 border border-black ${audio.inputMode === "demo" ? "bg-riso-pink text-white" : "hover:bg-gray-100"}`}>{t("source_demo")}</button>
                  <button onClick={() => audio.handleAudioInputToggle("mic")} className={`px-1 py-1 border border-black ${audio.inputMode === "mic" ? "bg-riso-black text-white" : "hover:bg-gray-100"}`}>{t("source_mic")}</button>
                  <button onClick={() => audio.handleAudioInputToggle("file")} className={`px-1 py-1 border border-black ${audio.inputMode === "file" ? "bg-riso-black text-white" : "hover:bg-gray-100"}`}>{t("source_file")}</button>
                  <button onClick={() => audio.handleAudioInputToggle("reflection")} className={`px-1 py-1 border border-black ${audio.inputMode === "reflection" ? "bg-riso-black text-white" : "hover:bg-gray-100"}`}>{t("source_voice")}</button>
                </div>
              </div>

              {audio.inputMode === "demo" ? (
                <div className="space-y-3">
                  <div className="text-[10px] font-mono mb-2 text-gray-500 uppercase">{t("demo_desc")}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(DEMO_PRESETS) as DemoPreset[]).map((preset) => (
                      <button key={preset} onClick={() => audio.handleDemoToggle(preset)} className={`p-2 border-2 border-black text-left transition-all ${audio.currentDemoPreset === preset && audio.isDemoPlaying ? "bg-riso-pink text-white shadow-none translate-y-1" : "bg-white hover:bg-gray-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"}`}>
                        <div className="flex items-center gap-2"><span className="text-lg">{DEMO_PRESETS[preset].icon}</span><div><div className="font-bold text-xs uppercase">{DEMO_PRESETS[preset].name}</div></div></div>
                      </button>
                    ))}
                  </div>
                  {audio.isDemoPlaying && (<div className="flex items-center justify-center gap-2 py-2 bg-riso-yellow/30 border border-black"><Activity className="w-4 h-4 animate-pulse text-riso-pink" /><span className="text-xs font-bold uppercase">{t("demo_playing", { name: DEMO_PRESETS[audio.currentDemoPreset].name })}</span></div>)}
                  <button onClick={() => audio.handleDemoToggle()} className={`w-full py-2 font-bold border-2 border-black transition-all uppercase ${audio.isDemoPlaying ? "bg-riso-black text-white" : "bg-riso-yellow hover:bg-yellow-300"}`}>{audio.isDemoPlaying ? t("stop_demo") : t("start_demo")}</button>
                </div>
              ) : audio.inputMode === "reflection" ? (
                <div className="space-y-3">
                  <div className="bg-riso-yellow/30 p-3 border-2 border-riso-black relative">
                    <MessageCircle className="absolute -top-2 -right-2 bg-white border border-black p-1 w-6 h-6" />
                    <div className="text-[10px] font-bold text-gray-500 mb-1 uppercase">{t("reflection_query")}</div>
                    <p className="font-mono text-sm font-bold leading-tight">{audio.reflectionQuestion}</p>
                    <button onClick={audio.cycleQuestion} className="absolute bottom-1 right-1 p-1 hover:bg-black/10 rounded-full"><RefreshCcw className="w-3 h-3" /></button>
                  </div>
                  <button onClick={audio.toggleReflectionRecording} className={`w-full py-3 px-4 font-bold border-2 border-riso-black transition-all flex items-center justify-center gap-2 uppercase ${audio.isRecordingReflection ? "bg-red-500 text-white animate-pulse" : "bg-white hover:bg-gray-100"}`}>
                    {audio.isRecordingReflection ? <><StopCircle /> {t("stop_recording")}</> : <><Mic2 /> {t("hold_to_answer")}</>}
                  </button>
                  <div className="text-[9px] text-gray-500 text-center leading-tight uppercase">{t("voice_hint")}</div>
                </div>
              ) : (
                <button onClick={() => audio.handleAudioInputToggle("mic")} className={`w-full py-3 px-4 font-bold border-2 border-riso-black transition-all duration-150 flex items-center justify-center gap-2 uppercase ${audio.inputMode === "mic" && audio.isListening ? "bg-riso-pink text-white shadow-none translate-y-1" : "bg-riso-yellow hover:bg-yellow-300"}`}>
                  {audio.inputMode === "mic" && audio.isListening ? <><Disc className="animate-spin" /> {t("halt_stream")}</> : <><Mic /> {t("open_mic")}</>}
                </button>
              )}
              <div className="w-full h-12 bg-black border border-black mt-2"><canvas ref={audio.visualizerCanvasRef} className="w-full h-full block" width={300} height={50} /></div>
            </div>
          </>
        )}
      </div>

      {/* MIDDLE/RIGHT: Canvas Area */}
      <div className="flex-1 relative bg-riso-paper flex flex-col h-screen">
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <button onClick={audio.handleSonify} disabled={labState !== "GROWING"} className={`p-3 border-2 border-riso-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${labState !== "GROWING" ? "opacity-50 cursor-not-allowed bg-gray-200" : audio.isSinging ? "bg-riso-pink text-white animate-pulse" : "bg-white hover:bg-gray-50"}`} title={t("toggle_voice")}>
            {audio.isSinging ? <Activity className="w-6 h-6 animate-bounce" /> : <Music className="w-6 h-6" />}
          </button>
          <div className="relative">
            <button onClick={triggerSaveProcess} disabled={labState !== "GROWING"} className={`p-3 border-2 border-riso-black shadow-[4px_4px_0px_0px_#00a651] transition-all ${labState !== "GROWING" ? "opacity-50 cursor-not-allowed bg-gray-200" : "bg-white"}`} title={t("archive_specimen")}>
              <Save className={`w-6 h-6 ${labState === "GROWING" ? "text-riso-black" : "text-gray-400"}`} />
            </button>
            {spec.lastSavedId && <div className="absolute top-full mt-2 right-0 bg-riso-green text-white text-xs font-bold px-2 py-1 border border-black animate-bounce z-50">{t("saved_alert")}</div>}
          </div>
          <button onClick={() => { spec.setShowGallery(!spec.showGallery); market.setShowMarketplace(false); }} className={`p-3 border-2 border-riso-black shadow-[4px_4px_0px_0px_#0078bf] transition-all ${spec.showGallery ? "bg-riso-blue text-white" : "bg-white"}`} title={t("my_collection")}>
            <Hash className="w-6 h-6" />
          </button>
          <button onClick={() => { market.setShowMarketplace(!market.showMarketplace); spec.setShowGallery(false); }} className={`p-3 border-2 border-riso-black shadow-[4px_4px_0px_0px_#00a651] transition-all ${market.showMarketplace ? "bg-riso-green text-white" : "bg-white"}`} title={t("marketplace")}>
            <Store className="w-6 h-6" />
          </button>
        </div>

        {/* Canvas — 始终挂载，保留动画状态 */}
        <div className="w-full h-full relative p-12 flex items-end justify-center">
          <div className="w-full h-full border-4 border-black relative bg-white/50 backdrop-blur-sm shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)]">
            <PlantCanvas analyzer={audio.analyzer} dna={dna} labState={labState} onBioUpdate={handleBioUpdate} triggerSnapshot={spec.triggerSnapshot} onSnapshot={handleSnapshotCaptured} />
            {audio.isListening && labState === "GROWING" && <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(transparent:50%,rgba(0,166,81,0.25):50%)] bg-[length:100%_4px]" />}
          </div>
        </div>

        {/* Gallery — 绝对定位叠加层，不卸载 Canvas */}
        {spec.showGallery && (
          <div className="absolute inset-0 z-10 bg-riso-paper w-full h-full px-8 pb-8 pt-24 overflow-y-auto custom-scrollbar">
            <div className="flex flex-wrap justify-between items-end gap-4 mb-8 border-b-2 border-riso-green pb-2">
              <div><h2 className="text-3xl font-bold text-riso-black uppercase">{t("herbarium_title")}</h2><p className="text-xs font-mono text-gray-500 uppercase">{t("gallery_hint")}</p></div>
              {spec.collection.length > 0 && <button onClick={spec.clearCollection} className="text-red-500 text-xs font-bold hover:underline bg-white px-2 py-1 border border-transparent hover:border-red-500 transition-colors uppercase"><Trash2 className="w-4 h-4 inline" /> {t("burn_all")}</button>}
            </div>
            {spec.collection.length === 0 ? (
              <div className="text-center mt-20 opacity-50 font-mono flex flex-col items-center"><Eye className="w-12 h-12 mb-4" /><p className="uppercase">{t("no_specimens")}</p><p className="text-xs mt-2 uppercase">{t("return_to_lab")}</p><button onClick={() => spec.setShowGallery(false)} className="mt-6 px-6 py-2 bg-riso-black text-white font-bold border-2 border-riso-black hover:bg-riso-blue uppercase transition-all flex items-center gap-2 group"><ArrowRight className="w-4 h-4 group-hover:translate-x-1" /> {t("go_to_lab_btn")}</button></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {spec.collection.map((specimen) => (
                  <div key={specimen.id} onClick={() => setSelectedSpecimen(specimen)} className="bg-white p-2 border-2 border-riso-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group hover:translate-y-1 hover:shadow-none">
                    <img src={specimen.imageData} alt={specimen.dna.speciesName} className="w-full h-48 object-cover mix-blend-multiply" />
                    <div className="p-3 font-mono text-xs border-t-2 border-dashed border-gray-300 mt-2 bg-gray-50">
                      <div className="flex justify-between items-center mb-1"><p className="font-bold text-sm truncate w-2/3">{specimen.dna.speciesName}</p>{specimen.txHash ? <Hash className="w-3 h-3 text-riso-green" /> : <span className="w-2 h-2 rounded-full bg-gray-300"></span>}</div>
                      <p className="text-gray-500 italic truncate uppercase">"{specimen.prompt}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Marketplace — 绝对定位叠加层，不卸载 Canvas */}
        {market.showMarketplace && (
          <div className="absolute inset-0 z-10 bg-riso-paper">
            <Marketplace onSelectListing={market.handleSelectListing} walletAddress={wallet.walletAddress} refreshKey={market.marketRefreshKey} />
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
