import React, { useState } from "react";
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

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);

  if (!isOpen) return null;

  const pages = [
    {
      title: "核心循环 (THE CORE LOOP)",
      icon: <RefreshCw className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <p className="text-sm font-mono text-gray-600 bg-riso-yellow/10 p-3 border-l-4 border-riso-yellow">
            Chain Garden 是一个将音频信号转化为生成艺术的链上实验室。通过五个步骤，你可以培育出属于自己的数字标本。
          </p>
          <div className="grid gap-4">
            {[
              { step: "01. 合成", text: "输入文字描述或上传图片，AI 将解析出独特的植物基因 (DNA)。", color: "text-riso-blue" },
              { step: "02. 播种", text: "确认 DNA 序列后进行播种，植物会在中央舞台以种子形态等待音频唤醒。", color: "text-riso-green" },
              { step: "03. 喂养", text: "开启麦克风或播放音乐。声音频率是生长的唯一养分，不同的节奏塑造不同的姿态。", color: "text-riso-pink" },
              { step: "04. 存档", text: "点击保存图标。系统会捕获当前的视觉快照和音频片段，将其存入本地标本馆。", color: "text-riso-black" },
              { step: "05. 铸造", text: "将心仪的标本铸造为 NFT，让你的创意永久记录在区块链上。", color: "text-riso-blue" },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start border-b border-gray-100 pb-2">
                <span className={`font-bold text-xs whitespace-nowrap ${item.color}`}>{item.step}</span>
                <span className="text-[11px] font-mono leading-tight">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "生长原理 (GROWTH BIOLOGY)",
      icon: <Activity className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-riso-black text-white p-4">
            <h4 className="text-xs font-bold mb-2 flex items-center gap-2 uppercase tracking-widest">
              <TrendingUp className="w-4 h-4 text-riso-yellow" /> 频率响应机制
            </h4>
            <div className="grid grid-cols-1 gap-3 font-mono text-[10px]">
              <div className="flex justify-between border-b border-white/20 pb-1">
                <span className="text-riso-blue">低频 (BASS 20-150Hz):</span>
                <span>主导【主干与根部】的生长粗细</span>
              </div>
              <div className="flex justify-between border-b border-white/20 pb-1">
                <span className="text-riso-green">中频 (MID 150-2500Hz):</span>
                <span>决定【分枝数量与弯曲度】</span>
              </div>
              <div className="flex justify-between border-b border-white/20 pb-1">
                <span className="text-riso-pink">高频 (TREBLE 2500Hz+):</span>
                <span>激发【叶片繁茂度与末端细节】</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-riso-black p-3 space-y-2">
              <div className="font-bold text-xs uppercase flex items-center gap-1">
                <Zap className="w-3 h-3 text-riso-pink" /> 压力 (STRESS)
              </div>
              <p className="text-[9px] font-mono leading-tight">
                当音量或频率剧烈波动时，植物会产生“压力感”，表现为线条抖动、杂色斑点或视觉破碎效果。
              </p>
            </div>
            <div className="border-2 border-riso-black p-3 space-y-2">
              <div className="font-bold text-xs uppercase flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-riso-green" /> 能量 (ENERGY)
              </div>
              <p className="text-[9px] font-mono leading-tight">
                能量反映了声音的实时强度。高能量会使植物产生“脉冲”动效，让结构产生呼吸般的膨胀感。
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-riso-blue/10 border border-riso-blue text-riso-blue rounded-sm">
            <MousePointer2 className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase">触碰交互：你的鼠标光标会吸引植物的分支，试着轻轻拨动它们。</span>
          </div>
        </div>
      ),
    },
    {
      title: "WEB3 与 标本馆 (COLLECTION)",
      icon: <ShieldCheck className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-riso-black flex items-center justify-center flex-shrink-0">
                <Save className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase">存档 vs 铸造 (ARCHIVE VS MINT)</h4>
                <p className="text-[10px] font-mono leading-relaxed mt-1">
                  <b>存档</b>仅将数据保存在你的浏览器本地。<b>铸造 (Mint)</b> 则是将数据上传到 IPFS 并将其转换为 ZetaChain 上的真实 NFT。一旦铸造成功，你可以永久拥有该作品。
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-riso-green flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase">市场与收益 (MARKETPLACE)</h4>
                <p className="text-[10px] font-mono leading-relaxed mt-1">
                  你可以将你的植物标本“碎片化”上市。其他用户可以购买该标本的股份。作为创作者，你不仅可以获得初始销售收入，还能享受作品流通产生的版税收益。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-riso-pink/10 border-2 border-riso-pink p-3 mt-4">
            <h4 className="text-xs font-bold text-riso-pink flex items-center gap-2 mb-1">
              <Info className="w-4 h-4" /> 常见问题解答 (FAQ)
            </h4>
            <ul className="space-y-2 text-[9px] font-mono text-gray-700">
              <li><b>Q: 为什么我的植物不生长了？</b><br/>A: 请确保你已经点击了 'PLANT SEED' 进入 GROWING 状态，并确保麦克风权限已开启或音频文件正在播放。</li>
              <li><b>Q: 不同的架构有什么区别？</b><br/>A: 例如 'fractal_tree' 更有几何感，而 'organic_vine' 则是自上而下生长的下垂藤蔓，尝试不同的 Prompt 会触发不同的隐藏形态。</li>
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
                Lab Manual v4.2
              </h2>
              <span className="text-[10px] font-mono opacity-80 mt-1">
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
                开始培育 (START)
              </button>
            ) : (
              <button
                onClick={nextPage}
                className="px-6 py-2 bg-riso-black text-white font-bold border-2 border-riso-black hover:bg-riso-blue transition-all uppercase text-sm"
              >
                下一页 (NEXT)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 辅助组件：RefreshCw 缺省导入
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

export default GuideModal;
