import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import {
  X,
  Zap,
  Trash2,
  Activity,
  FileText,
  Hash,
  Download,
  MessageCircle,
  Image,
  Share2,
} from "lucide-react";
import { Specimen } from "../types";

// Helper: wrap text into lines that fit maxWidth on a canvas context
function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxWidth && line !== "") {
      lines.push(line.trimEnd());
      line = word + " ";
    } else {
      line = test;
    }
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}

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
  const [isExporting, setIsExporting] = useState(false);
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

  // Download the raw plant snapshot image
  const handleDownloadImage = () => {
    const link = document.createElement("a");
    link.href = specimen.imageData;
    link.download = `ChainGarden_${specimen.dna.speciesName.replace(/\s+/g, "_")}_${specimen.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate a styled specimen card and share (Web Share API) or download
  const handleExportCard = async () => {
    setIsExporting(true);
    try {
      const W = 900, H = 540;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background
      ctx.fillStyle = "#f5f0e8";
      ctx.fillRect(0, 0, W, H);

      // Outer border
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = 4;
      ctx.strokeRect(6, 6, W - 12, H - 12);

      // Header bar
      ctx.fillStyle = "#111111";
      ctx.fillRect(6, 6, W - 12, 40);
      ctx.fillStyle = "#f5f0e8";
      ctx.font = "bold 13px monospace";
      ctx.fillText("CHAIN GARDEN HERBARIUM", 18, 31);
      if (specimen.txHash) {
        ctx.fillStyle = "#00a651";
        const mintedText = "✓ MINTED";
        const tw = ctx.measureText(mintedText).width;
        ctx.fillText(mintedText, W - tw - 18, 31);
      }

      // Load plant image
      const img = new window.Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = specimen.imageData;
      });

      // Left: image area (white bg + image cover-fit)
      const imgX = 16, imgY = 54, imgW = 370, imgH = H - 70;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(imgX, imgY, imgW, imgH);
      const imgAR = img.naturalWidth / img.naturalHeight;
      const areaAR = imgW / imgH;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (imgAR > areaAR) {
        sw = img.naturalHeight * areaAR;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / areaAR;
        sy = (img.naturalHeight - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, imgX, imgY, imgW, imgH);

      // Dashed vertical divider
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([7, 4]);
      ctx.beginPath();
      ctx.moveTo(394, 52);
      ctx.lineTo(394, H - 10);
      ctx.stroke();
      ctx.setLineDash([]);

      // Right side content
      const rx = 410;
      const rw = W - rx - 14;
      let ry = 72;

      // Species name (truncate if too wide)
      ctx.fillStyle = "#111111";
      ctx.font = "bold 22px sans-serif";
      let name = specimen.dna.speciesName.toUpperCase();
      while (ctx.measureText(name).width > rw && name.length > 1) {
        name = name.slice(0, -1);
      }
      ctx.fillText(name, rx, ry);
      ry += 8;

      // Green underline
      ctx.strokeStyle = "#00a651";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(W - 14, ry);
      ctx.stroke();
      ry += 18;

      // Arch + Mood
      ctx.fillStyle = "#888888";
      ctx.font = "11px monospace";
      ctx.fillText("ARCH:", rx, ry);
      ctx.fillStyle = "#111111";
      ctx.font = "bold 11px monospace";
      ctx.fillText(
        specimen.dna.growthArchitecture.replace(/_/g, " ").toUpperCase(),
        rx + 42, ry, rw / 2 - 42,
      );
      ctx.fillStyle = "#888888";
      ctx.font = "11px monospace";
      ctx.fillText("MOOD:", rx + rw / 2, ry);
      ctx.fillStyle = "#F566B8";
      ctx.font = "bold 11px monospace";
      ctx.fillText(specimen.dna.mood.toUpperCase(), rx + rw / 2 + 42, ry);
      ry += 18;

      // Leaf shape
      ctx.fillStyle = "#888888";
      ctx.font = "11px monospace";
      ctx.fillText("LEAF:", rx, ry);
      ctx.fillStyle = "#111111";
      ctx.font = "bold 11px monospace";
      ctx.fillText(
        `${specimen.dna.leafShape.toUpperCase()} / ${specimen.dna.leafArrangement.toUpperCase()}`,
        rx + 42, ry, rw - 42,
      );
      ry += 20;

      // Palette swatches
      ctx.fillStyle = "#888888";
      ctx.font = "11px monospace";
      ctx.fillText("PALETTE:", rx, ry);
      specimen.dna.colorPalette.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(rx + 70 + i * 26, ry - 7, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#111111";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
      ry += 18;

      // Dashed separator
      ctx.strokeStyle = "#cccccc";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(rx, ry); ctx.lineTo(W - 14, ry);
      ctx.stroke();
      ctx.setLineDash([]);
      ry += 16;

      // Prompt (max 4 lines)
      ctx.fillStyle = "#444444";
      ctx.font = "italic 12px serif";
      const promptLines = wrapTextLines(ctx, `"${specimen.prompt}"`, rw);
      for (const line of promptLines.slice(0, 4)) {
        ctx.fillText(line, rx, ry);
        ry += 17;
      }
      ry += 8;

      // Dashed separator
      ctx.strokeStyle = "#cccccc";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(rx, ry); ctx.lineTo(W - 14, ry);
      ctx.stroke();
      ctx.setLineDash([]);
      ry += 14;

      // DNA stats
      ctx.fillStyle = "#888888";
      ctx.font = "10px monospace";
      ctx.fillText(`BRANCH: ${specimen.dna.branchingFactor.toFixed(1)}`, rx, ry);
      ctx.fillText(`SPEED: ${specimen.dna.growthSpeed.toFixed(1)}`, rx + 120, ry);
      ctx.fillText(`ENERGY: ${(specimen.dna.energy * 100).toFixed(0)}%`, rx + 240, ry);
      ry += 16;
      ctx.fillText(`ANGLE VAR: ${specimen.dna.angleVariance}°`, rx, ry);

      // Footer
      ctx.fillStyle = "#aaaaaa";
      ctx.font = "10px monospace";
      ctx.fillText(`SPECIMEN #${specimen.id}`, rx, H - 30);
      ctx.fillText(`DATE: ${new Date(specimen.timestamp).toLocaleDateString()}`, rx, H - 16);
      ctx.fillStyle = "#00a651";
      ctx.font = "bold 10px monospace";
      const brand = "CHAIN GARDEN ✦";
      const bw = ctx.measureText(brand).width;
      ctx.fillText(brand, W - bw - 14, H - 16);

      // Export: share → download fallback
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const fileName = `ChainGarden_${specimen.dna.speciesName.replace(/\s+/g, "_")}.png`;
        const shareFile = new File([blob], fileName, { type: "image/png" });
        if (
          navigator.share &&
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [shareFile] })
        ) {
          try {
            await navigator.share({
              title: specimen.dna.speciesName,
              text: `"${specimen.prompt}" — Chain Garden`,
              files: [shareFile],
            });
            return;
          } catch {
            // cancelled or unsupported, fall through to download
          }
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (err) {
      console.error("Export card failed:", err);
    } finally {
      setIsExporting(false);
    }
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
            {/* Save / Export row */}
            <div className="flex gap-2">
              <button
                onClick={handleDownloadImage}
                className="flex-1 py-2 bg-white border-2 border-riso-black font-bold text-xs hover:bg-riso-black hover:text-white transition-all flex items-center justify-center gap-1 uppercase"
              >
                <Image className="w-3.5 h-3.5" />
                {t("detail_save_image")}
              </button>
              <button
                onClick={handleExportCard}
                disabled={isExporting}
                className="flex-1 py-2 bg-riso-blue text-white border-2 border-riso-blue font-bold text-xs hover:bg-white hover:text-riso-blue transition-all flex items-center justify-center gap-1 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Share2 className="w-3.5 h-3.5" />
                {isExporting ? t("detail_exporting") : t("detail_export_card")}
              </button>
            </div>

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
