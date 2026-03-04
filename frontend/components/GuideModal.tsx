import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import {
  X,
  Zap,
  Leaf,
  Music,
  Save,
  Database,
  HelpCircle,
  Dna,
  Mic2,
  ChevronRight,
  ChevronLeft,
  Activity,
  Info,
  ShieldCheck,
  TrendingUp,
  MousePointer2,
} from "lucide-react";

// 辅助组件：RefreshCw
const RefreshCw = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  const { language, t } = useLanguage();
  const [currentPage, setCurrentPage] = useState(0);

  if (!isOpen) return null;

  const pages = [
    {
      title: t("guide_loop_title"),
      icon: <RefreshCw className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <p className="text-sm font-mono text-gray-600 bg-riso-yellow/10 p-3 border-l-4 border-riso-yellow">
            {language === "zh" ? "Chain Garden 是一个将音频信号转化为生成艺术的链上实验室。" : "Chain Garden is a generative lab translating audio into art."}
          </p>
          <div className="grid gap-4">
            {[
              { title: t("guide_step_1_title"), desc: t("guide_step_1_desc"), color: "text-riso-blue" },
              { title: t("guide_step_2_title"), desc: t("guide_step_2_desc"), color: "text-riso-green" },
              { title: t("guide_step_3_title"), desc: t("guide_step_3_desc"), color: "text-riso-pink" },
              { title: t("guide_step_4_title"), desc: t("guide_step_4_desc"), color: "text-riso-black" },
              { title: t("guide_step_5_title"), desc: t("guide_step_5_desc"), color: "text-riso-blue" },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start border-b border-gray-100 pb-2">
                <span className={`font-bold text-xs whitespace-nowrap uppercase ${item.color}`}>{item.title}</span>
                <span className="text-[11px] font-mono leading-tight">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: t("guide_biology_title"),
      icon: <Activity className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-riso-black text-white p-4">
            <h4 className="text-xs font-bold mb-2 flex items-center gap-2 uppercase tracking-widest text-riso-yellow">
              {t("biology_freq_title")}
            </h4>
            <div className="grid grid-cols-1 gap-3 font-mono text-[10px] uppercase">
              <div className="border-b border-white/20 pb-1">{t("biology_bass")}</div>
              <div className="border-b border-white/20 pb-1">{t("biology_mid")}</div>
              <div className="border-b border-white/20 pb-1">{t("biology_treble")}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-riso-black p-3 space-y-2">
              <div className="font-bold text-xs uppercase flex items-center gap-1">
                <Zap className="w-3 h-3 text-riso-pink" /> {t("biology_stress").split(":")[0]}
              </div>
              <p className="text-[9px] font-mono leading-tight uppercase">
                {t("biology_stress").split(":")[1]}
              </p>
            </div>
            <div className="border-2 border-riso-black p-3 space-y-2">
              <div className="font-bold text-xs uppercase flex items-center gap-1 text-riso-green">
                <TrendingUp className="w-3 h-3" /> {t("biology_energy").split(":")[0]}
              </div>
              <p className="text-[9px] font-mono leading-tight uppercase">
                {t("biology_energy").split(":")[1]}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-riso-blue/10 border border-riso-blue text-riso-blue rounded-sm">
            <MousePointer2 className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase">{t("biology_mouse")}</span>
          </div>
        </div>
      ),
    },
    {
      title: t("guide_web3_title"),
      icon: <ShieldCheck className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-riso-black flex items-center justify-center flex-shrink-0">
                <Save className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase">{t("archive_vs_mint_title")}</h4>
                <p className="text-[10px] font-mono leading-relaxed mt-1">
                  {t("archive_vs_mint_desc")}
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-riso-green flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase">{t("market_royalties_title")}</h4>
                <p className="text-[10px] font-mono leading-relaxed mt-1 uppercase">
                  {t("market_royalties_desc")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-riso-pink/10 border-2 border-riso-pink p-3 mt-4">
            <h4 className="text-xs font-bold text-riso-pink flex items-center gap-2 mb-1 uppercase">
              <Info className="w-4 h-4" /> FAQ
            </h4>
            <ul className="space-y-2 text-[9px] font-mono text-gray-700 uppercase">
              <li>{t("faq_q1")}<br/>{t("faq_a1")}</li>
              <li>{t("faq_q2")}<br/>{t("faq_a2")}</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const nextPage = () => setCurrentPage((p) => Math.min(pages.length - 1, p + 1));
  const prevPage = () => setCurrentPage((p) => Math.max(0, p - 1));

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-riso-paper w-full max-w-2xl border-4 border-riso-black shadow-[20px_20px_0px_0px_rgba(26,26,26,1)] relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-riso-blue text-white p-4 flex justify-between items-center border-b-4 border-riso-black">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6" />
            <div className="flex flex-col">
              <h2 className="font-bold font-mono text-xl tracking-tighter uppercase leading-none">
                {t("guide_title")}
              </h2>
              <span className="text-[10px] font-mono opacity-80 mt-1 uppercase">
                SYSTEM_ACCESS: GRANTED | GARDEN_LOGS
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:rotate-90 transition-transform p-1 bg-white text-riso-black border-2 border-riso-black"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-riso-yellow flex items-center justify-center border-2 border-riso-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {pages[currentPage].icon}
            </div>
            <h3 className="text-2xl font-bold uppercase tracking-tighter text-riso-black">
              {pages[currentPage].title}
            </h3>
          </div>

          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {pages[currentPage].content}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-gray-50 border-t-4 border-riso-black flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              className={`p-2 border-2 border-riso-black transition-all ${
                currentPage === 0 ? "opacity-30 grayscale cursor-not-allowed" : "bg-white hover:bg-riso-blue hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage === pages.length - 1}
              className={`p-2 border-2 border-riso-black transition-all ${
                currentPage === pages.length - 1 ? "opacity-30 grayscale cursor-not-allowed" : "bg-white hover:bg-riso-blue hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
              }`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {pages.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 border border-riso-black ${
                    i === currentPage ? "bg-riso-black scale-125" : "bg-gray-300"
                  } transition-all`}
                />
              ))}
            </div>
            
            {currentPage === pages.length - 1 ? (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-riso-green text-white font-bold border-2 border-riso-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all uppercase text-sm"
              >
                {t("start_btn")}
              </button>
            ) : (
              <button
                onClick={nextPage}
                className="px-6 py-2 bg-riso-black text-white font-bold border-2 border-riso-black hover:bg-riso-blue transition-all uppercase text-sm"
              >
                {t("next")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideModal;
