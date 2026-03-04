import React from "react";
import { useLanguage } from "../contexts/LanguageContext";
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
  const { t } = useLanguage();
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
      data-oid="rbd1pg6"
    >
      <div
        className="bg-riso-paper w-full max-w-4xl h-[80vh] border-4 border-riso-black shadow-[12px_12px_0px_0px_rgba(0,166,81,1)] flex flex-col md:flex-row overflow-hidden relative animate-in fade-in zoom-in duration-200"
        data-oid="42k5wte"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-white border-2 border-black p-1 hover:bg-riso-pink hover:text-white transition-colors"
          data-oid="z45zzi1"
        >
          <X className="w-6 h-6" data-oid="9wgi:5x" />
        </button>

        {/* LEFT: Image */}
        <div
          className="w-full md:w-1/2 bg-gray-100 relative border-b-4 md:border-b-0 md:border-r-4 border-black p-4 flex items-center justify-center bg-grain"
          data-oid="6vh-2tw"
        >
          <div
            className="relative w-full h-full border-2 border-black bg-white shadow-md p-2 rotate-[-1deg]"
            data-oid="q0.8351"
          >
            <img
              src={specimen.imageData}
              alt={specimen.dna.speciesName}
              className="w-full h-full object-contain mix-blend-multiply"
              data-oid="a.qwpcy"
            />

            <div
              className="absolute bottom-4 left-4 bg-riso-black text-white px-2 py-1 text-xs font-mono"
              data-oid="p23nfnj"
            >
              ID: {specimen.id}
            </div>
          </div>
        </div>

        {/* RIGHT: Data Sheet */}
        <div
          className="w-full md:w-1/2 p-8 overflow-y-auto font-mono flex flex-col"
          data-oid="1iru:e6"
        >
          <div
            className="border-b-4 border-double border-riso-black pb-4 mb-6"
            data-oid="iywj._n"
          >
            <h2
              className="text-3xl font-bold text-riso-blue uppercase leading-tight"
              data-oid="_5c9oqs"
            >
              {specimen.dna.speciesName}
            </h2>
            <p className="text-xs text-gray-500 mt-1 uppercase" data-oid="wi7nntm">
              {t("detail_created")} {new Date(specimen.timestamp).toLocaleString()}
            </p>
          </div>

          {/* Prompt Section */}
          <div
            className="mb-6 bg-riso-yellow/20 border border-riso-black p-4 relative"
            data-oid="rk0fbl4"
          >
            <div
              className="absolute -top-3 left-2 bg-riso-paper px-1 text-xs font-bold text-riso-black flex items-center gap-1 uppercase"
              data-oid="gj5eg1r"
            >
              <FileText className="w-3 h-3" data-oid="d.sjrz-" /> {t("reflection_title")}
            </div>
            <p
              className="text-sm italic text-riso-black break-words"
              data-oid=".9mpm7e"
            >
              "{specimen.prompt}"
            </p>
          </div>

          {/* Reflection Playback */}
          {specimen.reflectionAudioData && (
            <div
              className="mb-6 bg-riso-green/10 border border-riso-green p-4 relative"
              data-oid="asx9m3."
            >
              <div
                className="absolute -top-3 left-2 bg-riso-paper px-1 text-xs font-bold text-riso-green flex items-center gap-1 uppercase"
                data-oid="dxfl59h"
              >
                <MessageCircle className="w-3 h-3" data-oid="ml:m79:" /> {t("mint_voice")}
              </div>
              {/* Display the Question if available */}
              {specimen.reflectionQuestion && (
                <p className="font-bold text-xs mb-2 italic" data-oid="-qbrtjb">
                  "{specimen.reflectionQuestion}"
                </p>
              )}
              <div className="mt-2" data-oid="gp1u79j">
                <audio
                  controls
                  src={specimen.reflectionAudioData}
                  className="w-full h-8"
                  data-oid="klk9xn:"
                />
              </div>
              <p
                className="text-[10px] text-gray-500 mt-1 italic uppercase"
                data-oid="a43_yb0"
              >
                {t("record_voice_desc")}
              </p>
            </div>
          )}

          {/* DNA Stats */}
          <div
            className="grid grid-cols-2 gap-4 mb-6 text-xs"
            data-oid="w0vo289"
          >
            <div className="space-y-1" data-oid="hpcvqli">
              <span
                className="block font-bold text-gray-400 uppercase"
                data-oid="5-ja:n5"
              >
                {t("growth_arch")}
              </span>
              <span
                className="block text-lg uppercase border-b border-dashed border-gray-300 pb-1"
                data-oid="1:92j55"
              >
                {t(specimen.dna.growthArchitecture as any) || specimen.dna.growthArchitecture.replace("_", " ")}
              </span>
            </div>
            <div className="space-y-1" data-oid="gz8g55_">
              <span
                className="block font-bold text-gray-400 uppercase"
                data-oid="417:9mb"
              >
                {t("leaf_type")}
              </span>
              <span
                className="block text-lg uppercase border-b border-dashed border-gray-300 pb-1"
                data-oid="6hjoo9s"
              >
                {t(specimen.dna.leafShape as any) || specimen.dna.leafShape}
              </span>
            </div>
            <div className="space-y-1" data-oid="7i.f7rj">
              <span
                className="block font-bold text-gray-400 uppercase"
                data-oid="az.p:b:"
              >
                {t("growth_speed")}
              </span>
              <div
                className="w-full h-2 bg-gray-200 border border-black"
                data-oid="iy:rcw7"
              >
                <div
                  className="h-full bg-riso-green"
                  style={{ width: `${(specimen.dna.growthSpeed / 3) * 100}%` }}
                  data-oid="303w:o8"
                ></div>
              </div>
            </div>
            <div className="space-y-1" data-oid="9pl5-:v">
              <span
                className="block font-bold text-gray-400"
                data-oid="tpukin2"
              >
                PALETTE
              </span>
              <div className="flex gap-1" data-oid="g:h7f_u">
                {specimen.dna.colorPalette.map((c, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border border-black"
                    style={{ backgroundColor: c }}
                    data-oid="ppp0irv"
                  ></div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-3" data-oid="qzziuy1">
            {/* Audio Download */}
            {specimen.audioData && (
              <button
                onClick={handleDownloadAudio}
                className="w-full py-2 bg-riso-pink text-white font-bold border-2 border-black hover:bg-white hover:text-riso-pink transition-all flex items-center justify-center gap-2 mb-2 uppercase"
                data-oid="93l:u8a"
              >
                <Download className="w-4 h-4" data-oid="_0nsl.7" />
                {t("mint_music")} (DOWNLOAD)
              </button>
            )}

            {/* Blockchain Status */}
            <div
              className={`p-3 border-2 ${specimen.txHash ? "border-riso-green bg-green-50" : "border-gray-300 bg-gray-50"}`}
              data-oid="yjuq6m_"
            >
              <div
                className="flex justify-between items-center"
                data-oid=".cstka8"
              >
                <span
                  className="font-bold flex items-center gap-2 uppercase"
                  data-oid="psyot5x"
                >
                  <Hash className="w-4 h-4" data-oid="s:-fv54" /> {t("status")}
                </span>
                {specimen.txHash ? (
                  <span
                    className="text-riso-green font-bold text-xs px-2 py-1 bg-green-100 border border-green-500 uppercase"
                    data-oid="sksyxhw"
                  >
                    {t("status_minted")}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs uppercase" data-oid="xyn7sz:">
                    {t("status_archive")}
                  </span>
                )}
              </div>
              {specimen.txHash && (
                <a
                  href={`https://testnet.zetascan.com/tx/${specimen.txHash}`}
                  target="_blank"
                  className="text-[10px] text-riso-blue hover:underline block mt-1 truncate"
                  data-oid="j68xfxs"
                >
                  Tx: {specimen.txHash}
                </a>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3" data-oid=".fbyc.p">
              {!specimen.txHash ? (
                <button
                  onClick={() => onMint(specimen)}
                  className="flex-1 py-3 bg-riso-black text-white font-bold border-2 border-transparent hover:bg-white hover:text-riso-black hover:border-riso-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 uppercase"
                  data-oid="onjr5-1"
                >
                  <Zap className="w-5 h-5" data-oid="qx:i3-v" />
                  {walletConnected ? t("detail_mint_btn") : t("wallet_connect")}
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 py-3 bg-gray-200 text-gray-400 font-bold border-2 border-transparent cursor-not-allowed flex items-center justify-center gap-2 uppercase"
                  data-oid="8pocq7b"
                >
                  <Activity className="w-5 h-5" data-oid="z7isj7p" />
                  {t("status_minted")}
                </button>
              )}

              <button
                onClick={() => {
                  if (confirm(t("detail_delete_confirm"))) {
                    onDelete(specimen.id);
                    onClose();
                  }
                }}
                className="px-4 bg-white border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                title={t("detail_delete_btn")}
                data-oid="pjfxtu7"
              >
                <Trash2 className="w-5 h-5" data-oid="3o5del9" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecimenDetailModal;
