import React, { useEffect, useState } from "react";
import {
  X,
  Check,
  Loader,
  Wallet,
  Database,
  Music,
  Dna,
  FileImage,
  MessageCircle,
  Cpu,
  Lock,
} from "lucide-react";
import { Specimen } from "../types";

export interface AssetSelection {
  image: boolean;
  dna: boolean;
  audio: boolean;
  voice: boolean;
}

interface MintModalProps {
  isOpen: boolean;
  onClose: () => void;
  specimen: Specimen | null;
  onConfirmMint: (selection: AssetSelection) => Promise<void>;
  walletAddress: string;
  isMinting: boolean;
}

const MintModal: React.FC<MintModalProps> = ({
  isOpen,
  onClose,
  specimen,
  onConfirmMint,
  walletAddress,
  isMinting,
}) => {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  // 0: Curate, 1: Uploading IPFS, 2: Signing Wallet, 3: Success

  const [selection, setSelection] = useState<AssetSelection>({
    image: true,
    dna: true,
    audio: true,
    voice: true,
  });

  useEffect(() => {
    if (isOpen && specimen) {
      setStep(0);
      // Reset defaults based on availability
      setSelection({
        image: true,
        dna: true,
        audio: !!specimen.audioData,
        voice: !!specimen.reflectionAudioData,
      });
    }
  }, [isOpen, specimen]);

  useEffect(() => {
    if (isMinting) {
      setStep(1);
      const t1 = setTimeout(() => setStep(2), 2500); // Wait for "IPFS"
      return () => clearTimeout(t1);
    }
  }, [isMinting]);

  if (!isOpen || !specimen) return null;

  const handleMintClick = async () => {
    await onConfirmMint(selection);
    setStep(3);
  };

  const toggleSelection = (key: keyof AssetSelection) => {
    if (key === "image") return; // Locked
    setSelection((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      data-oid="r2t.zb5"
    >
      <div
        className="bg-riso-paper w-full max-w-md border-4 border-riso-black shadow-[16px_16px_0px_0px_rgba(26,26,26,1)] relative flex flex-col max-h-[90vh]"
        data-oid="3gxdc22"
      >
        {/* Modal Header */}
        <div
          className="bg-riso-black text-white p-3 flex justify-between items-center border-b-4 border-white"
          data-oid="rzaqzoh"
        >
          <div className="flex items-center gap-2" data-oid="xribre:">
            <Cpu className="w-5 h-5" data-oid="mv5y8yf" />
            <h2
              className="font-bold font-mono text-lg tracking-widest"
              data-oid="tgt-_4a"
            >
              MINT_TERMINAL_v1
            </h2>
          </div>
          <button
            onClick={onClose}
            className="hover:text-riso-pink transition-colors"
            data-oid="k-6x20x"
          >
            <X className="w-6 h-6" data-oid=":xe5ho1" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto font-mono" data-oid="ej5cnjo">
          {step === 3 ? (
            <div
              className="text-center space-y-6 animate-in fade-in zoom-in duration-300"
              data-oid="gc60emm"
            >
              <div
                className="w-24 h-24 bg-riso-green rounded-full mx-auto flex items-center justify-center border-4 border-black"
                data-oid="sf8:t2x"
              >
                <Check className="w-12 h-12 text-white" data-oid="aekisa." />
              </div>
              <div data-oid="v756gjz">
                <h3
                  className="text-2xl font-bold text-riso-black mb-2"
                  data-oid="_tz8b.r"
                >
                  SPECIMEN ON-CHAIN
                </h3>
                <p className="text-xs text-gray-600" data-oid="4_z0vjh">
                  Token ID #{Math.floor(Math.random() * 9999)} successfully
                  minted.
                </p>
              </div>
              <div
                className="bg-gray-100 p-4 border-2 border-dashed border-gray-400 text-left text-xs break-all font-mono"
                data-oid="q2x6.bd"
              >
                <span
                  className="block font-bold text-gray-500 mb-1"
                  data-oid=".15n8q2"
                >
                  TRANSACTION HASH:
                </span>
                {specimen.txHash ? (
                  <a
                    href={`https://testnet.zetascan.com/tx/${specimen.txHash}`}
                    target="_blank"
                    className="text-riso-blue hover:underline break-all"
                  >
                    {specimen.txHash}
                  </a>
                ) : (
                  "0x712..."
                )}
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 bg-riso-black text-white font-bold hover:bg-riso-green border-2 border-transparent hover:border-black transition-all"
                data-oid="21zq0h:"
              >
                RETURN TO LAB
              </button>
            </div>
          ) : (
            <div className="space-y-6" data-oid="2b6svke">
              {/* Image Preview */}
              <div
                className="relative w-full aspect-square border-2 border-black p-2 bg-white rotate-1 shadow-md"
                data-oid="3vgb.px"
              >
                <img
                  src={specimen.imageData}
                  className="w-full h-full object-cover mix-blend-multiply"
                  data-oid=".fbs-1u"
                />

                <div
                  className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 text-xs font-bold border border-black"
                  data-oid="0_y8pbb"
                >
                  {specimen.dna.speciesName}
                </div>
              </div>

              {/* Step 0: Curate Assets */}
              {step === 0 && (
                <div className="space-y-3" data-oid="2vjnjs9">
                  <div
                    className="text-sm font-bold border-b-2 border-black pb-1 mb-2"
                    data-oid="i69lfr4"
                  >
                    CURATE ON-CHAIN ASSETS
                  </div>

                  {/* Option 1: Visuals */}
                  <div
                    onClick={() => toggleSelection("image")}
                    className={`flex items-center justify-between p-3 border-2 border-black transition-all cursor-not-allowed bg-gray-100`}
                    data-oid="oxn2ian"
                  >
                    <div className="flex items-center gap-3" data-oid="g1z_yml">
                      <FileImage
                        className="w-5 h-5 text-riso-blue"
                        data-oid="s0jbgi-"
                      />

                      <div data-oid="fj.06h.">
                        <div className="text-xs font-bold" data-oid="9wwvuc-">
                          VISUAL SPECIMEN
                        </div>
                        <div
                          className="text-[10px] text-gray-500"
                          data-oid="bycyczz"
                        >
                          High-res PNG (Required)
                        </div>
                      </div>
                    </div>
                    <Lock
                      className="w-4 h-4 text-gray-400"
                      data-oid="d-:se4d"
                    />
                  </div>

                  {/* Option 2: DNA */}
                  <div
                    onClick={() => toggleSelection("dna")}
                    className={`flex items-center justify-between p-3 border-2 border-black transition-all cursor-pointer hover:translate-x-1
                                ${selection.dna ? "bg-riso-yellow/30" : "bg-white hover:bg-gray-50"}`}
                    data-oid="qt:7_p-"
                  >
                    <div className="flex items-center gap-3" data-oid="xmxnc14">
                      <Dna
                        className="w-5 h-5 text-riso-green"
                        data-oid="zj2zkcz"
                      />

                      <div data-oid="mfg00o.">
                        <div className="text-xs font-bold" data-oid="1y5i1u6">
                          GENETIC CODE
                        </div>
                        <div
                          className="text-[10px] text-gray-500"
                          data-oid="r1a1ohi"
                        >
                          DNA Parameters as Traits
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 border-2 border-black flex items-center justify-center ${selection.dna ? "bg-riso-black" : "bg-white"}`}
                      data-oid="od8bq:y"
                    >
                      {selection.dna && (
                        <Check
                          className="w-3 h-3 text-white"
                          data-oid="fwxdel3"
                        />
                      )}
                    </div>
                  </div>

                  {/* Option 3: Music */}
                  <div
                    onClick={() =>
                      specimen.audioData && toggleSelection("audio")
                    }
                    className={`flex items-center justify-between p-3 border-2 border-black transition-all 
                                ${!specimen.audioData ? "opacity-50 cursor-not-allowed bg-gray-100" : "cursor-pointer hover:translate-x-1"}
                                ${selection.audio ? "bg-riso-pink/20" : ""}`}
                    data-oid=":.pmves"
                  >
                    <div className="flex items-center gap-3" data-oid="xb:tdn-">
                      <Music
                        className="w-5 h-5 text-riso-pink"
                        data-oid="j9vmobd"
                      />

                      <div data-oid="b.d1puu">
                        <div className="text-xs font-bold" data-oid="zxenna9">
                          GENERATIVE MUSIC
                        </div>
                        <div
                          className="text-[10px] text-gray-500"
                          data-oid="0i.26.8"
                        >
                          {specimen.audioData
                            ? "Include Audio (MP3)"
                            : "No recording available"}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 border-2 border-black flex items-center justify-center ${selection.audio ? "bg-riso-black" : "bg-white"}`}
                      data-oid="qk16vrz"
                    >
                      {selection.audio && (
                        <Check
                          className="w-3 h-3 text-white"
                          data-oid="llolyja"
                        />
                      )}
                    </div>
                  </div>

                  {/* Option 4: Voice */}
                  <div
                    onClick={() =>
                      specimen.reflectionAudioData && toggleSelection("voice")
                    }
                    className={`flex items-center justify-between p-3 border-2 border-black transition-all 
                                ${!specimen.reflectionAudioData ? "opacity-50 cursor-not-allowed bg-gray-100" : "cursor-pointer hover:translate-x-1"}
                                ${selection.voice ? "bg-riso-blue/20" : ""}`}
                    data-oid="75t8x76"
                  >
                    <div className="flex items-center gap-3" data-oid="ret55q1">
                      <MessageCircle
                        className="w-5 h-5 text-riso-blue"
                        data-oid="crwd_nv"
                      />

                      <div data-oid="50wwxiz">
                        <div className="text-xs font-bold" data-oid="0693q85">
                          VOICE REFLECTION
                        </div>
                        <div
                          className="text-[10px] text-gray-500"
                          data-oid="zi6g9bp"
                        >
                          {specimen.reflectionAudioData
                            ? "Include Reflection"
                            : "No reflection available"}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 border-2 border-black flex items-center justify-center ${selection.voice ? "bg-riso-black" : "bg-white"}`}
                      data-oid="m9ujw3:"
                    >
                      {selection.voice && (
                        <Check
                          className="w-3 h-3 text-white"
                          data-oid="3mkxup9"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Progress / Action Area */}
              <div
                className="border-t-4 border-double border-black pt-4"
                data-oid="v_1cs0h"
              >
                {step === 0 && (
                  <button
                    onClick={handleMintClick}
                    disabled={isMinting}
                    className="w-full py-4 bg-riso-pink text-white font-bold text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all flex items-center justify-center gap-3"
                    data-oid="r-u8hhf"
                  >
                    <Database className="w-5 h-5" data-oid="oanwv74" />
                    INITIATE MINT
                  </button>
                )}

                {step === 1 && (
                  <div
                    className="flex flex-col gap-2 text-riso-blue animate-pulse"
                    data-oid="f-.d-ku"
                  >
                    <div
                      className="flex items-center gap-2 font-bold"
                      data-oid="x2t-cu."
                    >
                      <Loader
                        className="animate-spin w-4 h-4"
                        data-oid="2_0kbr2"
                      />
                      UPLOADING ASSETS TO IPFS...
                    </div>
                    <div
                      className="text-[10px] font-mono text-gray-500"
                      data-oid="3ick1ke"
                    >
                      Building Metadata JSON based on selection...
                    </div>
                    <div
                      className="h-2 w-full bg-gray-200 border border-black overflow-hidden"
                      data-oid="kraog2s"
                    >
                      <div
                        className="h-full bg-riso-blue w-2/3 animate-pulse"
                        data-oid="ds-diof"
                      ></div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div
                    className="flex flex-col gap-2 text-riso-green"
                    data-oid="jrffswf"
                  >
                    <div
                      className="flex items-center gap-2 font-bold"
                      data-oid="621-d-u"
                    >
                      <Wallet
                        className="animate-bounce w-4 h-4"
                        data-oid="vnj7106"
                      />
                      AWAITING SIGNATURE...
                    </div>
                    <p className="text-xs text-gray-500" data-oid="dksn--s">
                      Please confirm transaction in your wallet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MintModal;
