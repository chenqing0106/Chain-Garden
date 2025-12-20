import React from "react";
import {
  X,
  Zap,
  Trash2,
  Share2,
  Activity,
  FileText,
  Hash,
  Download,
  MessageCircle,
} from "lucide-react";
import { Specimen } from "../types";

interface SpecimenDetailModalProps {
  specimen: Specimen | null;
  onClose: () => void;
  onMint: (specimen: Specimen) => void;
  onDelete: (id: string) => void;
  walletConnected: boolean;
}

const SpecimenDetailModal: React.FC<SpecimenDetailModalProps> = ({
  specimen,
  onClose,
  onMint,
  onDelete,
  walletConnected,
}) => {
  if (!specimen) return null;

  // Helper to trigger audio download
  const handleDownloadAudio = () => {
    if (!specimen.audioData) return;

    const link = document.createElement("a");
    link.href = specimen.audioData;
    link.download = `${specimen.dna.speciesName.replace(/\s+/g, "_")}_${specimen.id}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      data-oid="sm2et8e"
    >
      <div
        className="bg-riso-paper w-full max-w-4xl h-[80vh] border-4 border-riso-black shadow-[12px_12px_0px_0px_rgba(0,166,81,1)] flex flex-col md:flex-row overflow-hidden relative animate-in fade-in zoom-in duration-200"
        data-oid="uex06kg"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-white border-2 border-black p-1 hover:bg-riso-pink hover:text-white transition-colors"
          data-oid="fszaw-e"
        >
          <X className="w-6 h-6" data-oid="c1odnym" />
        </button>

        {/* LEFT: Image */}
        <div
          className="w-full md:w-1/2 bg-gray-100 relative border-b-4 md:border-b-0 md:border-r-4 border-black p-4 flex items-center justify-center bg-grain"
          data-oid="0hcp1dq"
        >
          <div
            className="relative w-full h-full border-2 border-black bg-white shadow-md p-2 rotate-[-1deg]"
            data-oid="dvp4hfw"
          >
            <img
              src={specimen.imageData}
              alt={specimen.dna.speciesName}
              className="w-full h-full object-contain mix-blend-multiply"
              data-oid="h9.h4r7"
            />

            <div
              className="absolute bottom-4 left-4 bg-riso-black text-white px-2 py-1 text-xs font-mono"
              data-oid="oks9qs_"
            >
              ID: {specimen.id}
            </div>
          </div>
        </div>

        {/* RIGHT: Data Sheet */}
        <div
          className="w-full md:w-1/2 p-8 overflow-y-auto font-mono flex flex-col"
          data-oid="6_hqst."
        >
          <div
            className="border-b-4 border-double border-riso-black pb-4 mb-6"
            data-oid="pkdc9g-"
          >
            <h2
              className="text-3xl font-bold text-riso-blue uppercase leading-tight"
              data-oid="f6n78lc"
            >
              {specimen.dna.speciesName}
            </h2>
            <p className="text-xs text-gray-500 mt-1" data-oid="vaigg.t">
              DISCOVERED: {new Date(specimen.timestamp).toLocaleString()}
            </p>
          </div>

          {/* Prompt Section */}
          <div
            className="mb-6 bg-riso-yellow/20 border border-riso-black p-4 relative"
            data-oid="pe4p939"
          >
            <div
              className="absolute -top-3 left-2 bg-riso-paper px-1 text-xs font-bold text-riso-black flex items-center gap-1"
              data-oid=".gx:pjz"
            >
              <FileText className="w-3 h-3" data-oid="qgtju-i" /> ORIGIN PROMPT
              (USER INPUT)
            </div>
            <p
              className="text-sm italic text-riso-black break-words"
              data-oid="g3liod."
            >
              "{specimen.prompt}"
            </p>
          </div>

          {/* Reflection Playback */}
          {specimen.reflectionAudioData && (
            <div
              className="mb-6 bg-riso-green/10 border border-riso-green p-4 relative"
              data-oid="qh01mcc"
            >
              <div
                className="absolute -top-3 left-2 bg-riso-paper px-1 text-xs font-bold text-riso-green flex items-center gap-1"
                data-oid="6cbdy-j"
              >
                <MessageCircle className="w-3 h-3" data-oid="k1o0lft" /> VOICE
                REFLECTION
              </div>
              {/* Display the Question if available */}
              {specimen.reflectionQuestion && (
                <p className="font-bold text-xs mb-2 italic" data-oid="f.e-ak8">
                  "{specimen.reflectionQuestion}"
                </p>
              )}
              <div className="mt-2" data-oid="_o83sje">
                <audio
                  controls
                  src={specimen.reflectionAudioData}
                  className="w-full h-8"
                  data-oid="cwnai.y"
                />
              </div>
              <p
                className="text-[10px] text-gray-500 mt-1 italic"
                data-oid="fzjddw1"
              >
                Recorded response to self-exploration query.
              </p>
            </div>
          )}

          {/* DNA Stats */}
          <div
            className="grid grid-cols-2 gap-4 mb-6 text-xs"
            data-oid=":l7imw."
          >
            <div className="space-y-1" data-oid="l3k8des">
              <span
                className="block font-bold text-gray-400"
                data-oid="2.u2dxv"
              >
                ARCHITECTURE
              </span>
              <span
                className="block text-lg uppercase border-b border-dashed border-gray-300 pb-1"
                data-oid="tft.c0:"
              >
                {specimen.dna.growthArchitecture.replace("_", " ")}
              </span>
            </div>
            <div className="space-y-1" data-oid="wwlt.89">
              <span
                className="block font-bold text-gray-400"
                data-oid="jm3xi7w"
              >
                LEAF TYPE
              </span>
              <span
                className="block text-lg uppercase border-b border-dashed border-gray-300 pb-1"
                data-oid="uz1zmy_"
              >
                {specimen.dna.leafShape}
              </span>
            </div>
            <div className="space-y-1" data-oid="8ndo8lh">
              <span
                className="block font-bold text-gray-400"
                data-oid="p1m_-wj"
              >
                GROWTH RATE
              </span>
              <div
                className="w-full h-2 bg-gray-200 border border-black"
                data-oid="8xjxhau"
              >
                <div
                  className="h-full bg-riso-green"
                  style={{ width: `${(specimen.dna.growthSpeed / 3) * 100}%` }}
                  data-oid="vp3ysax"
                ></div>
              </div>
            </div>
            <div className="space-y-1" data-oid="3e.rs69">
              <span
                className="block font-bold text-gray-400"
                data-oid="a5:j_qh"
              >
                PALETTE
              </span>
              <div className="flex gap-1" data-oid="5o-2a22">
                {specimen.dna.colorPalette.map((c, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border border-black"
                    style={{ backgroundColor: c }}
                    data-oid="fyh868-"
                  ></div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-3" data-oid="t.lpfgd">
            {/* Audio Download */}
            {specimen.audioData && (
              <button
                onClick={handleDownloadAudio}
                className="w-full py-2 bg-riso-pink text-white font-bold border-2 border-black hover:bg-white hover:text-riso-pink transition-all flex items-center justify-center gap-2 mb-2"
                data-oid="bvs3umq"
              >
                <Download className="w-4 h-4" data-oid="q629eyc" />
                DOWNLOAD RECORDED AUDIO
              </button>
            )}

            {/* Blockchain Status */}
            <div
              className={`p-3 border-2 ${specimen.txHash ? "border-riso-green bg-green-50" : "border-gray-300 bg-gray-50"}`}
              data-oid="s.ds4cl"
            >
              <div
                className="flex justify-between items-center"
                data-oid="-xjht.t"
              >
                <span
                  className="font-bold flex items-center gap-2"
                  data-oid="8x6v_gz"
                >
                  <Hash className="w-4 h-4" data-oid="6.4e4id" /> BLOCKCHAIN
                  STATUS
                </span>
                {specimen.txHash ? (
                  <span
                    className="text-riso-green font-bold text-xs px-2 py-1 bg-green-100 border border-green-500"
                    data-oid="26jyq1i"
                  >
                    MINTED
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs" data-oid="rdxv257">
                    NOT ON CHAIN
                  </span>
                )}
              </div>
              {specimen.txHash && (
                <a
                  href={`https://testnet.zetascan.com/tx/${specimen.txHash}`}
                  target="_blank"
                  className="text-[10px] text-riso-blue hover:underline block mt-1 truncate"
                  data-oid="n8y14jo"
                >
                  Tx: {specimen.txHash}
                </a>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3" data-oid="3i3bdgk">
              {!specimen.txHash ? (
                <button
                  onClick={() => onMint(specimen)}
                  className="flex-1 py-3 bg-riso-black text-white font-bold border-2 border-transparent hover:bg-white hover:text-riso-black hover:border-riso-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
                  data-oid="a.9-8kn"
                >
                  <Zap className="w-5 h-5" data-oid="101pc-o" />
                  {walletConnected ? "MINT NFT" : "CONNECT TO MINT"}
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 py-3 bg-gray-200 text-gray-400 font-bold border-2 border-transparent cursor-not-allowed flex items-center justify-center gap-2"
                  data-oid="5r0fc::"
                >
                  <Activity className="w-5 h-5" data-oid="k5mjy.y" />
                  ALREADY MINTED
                </button>
              )}

              <button
                onClick={() => {
                  if (confirm("Permanently decompose this specimen?")) {
                    onDelete(specimen.id);
                    onClose();
                  }
                }}
                className="px-4 bg-white border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                title="Delete Specimen"
                data-oid="5wo.2ld"
              >
                <Trash2 className="w-5 h-5" data-oid="nguvtqd" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecimenDetailModal;
