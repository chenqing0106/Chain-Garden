import React from 'react';
import { useLanguage } from "../contexts/LanguageContext";
import { Leaf, Users, TrendingUp, Music, Zap, Dna, MessageCircle } from 'lucide-react';
import { MarketListing } from '../types';

interface MusicCardProps {
  listing: MarketListing;
  onClick: (listing: MarketListing) => void;
}

const MusicCard: React.FC<MusicCardProps> = ({ listing, onClick }) => {
  const { t } = useLanguage();
  const { specimen, creatorName, pricePerShare, totalShares, soldShares, genre } = listing;
  const availableShares = totalShares - soldShares;
  const soldPercentage = (soldShares / totalShares) * 100;
  
  // 检查作品包含哪些内容
  const hasMusic = !!specimen.audioData;
  const hasVoice = !!specimen.reflectionAudioData;
  
  return (
    <div
      onClick={() => onClick(listing)}
      className="bg-white border-2 border-riso-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] 
                 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px]
                 transition-all cursor-pointer group overflow-hidden"
    >
      {/* 图片区域 */}
      <div className="relative aspect-square overflow-hidden border-b-2 border-riso-black">
        <img
          src={specimen.imageData}
          alt={specimen.dna.speciesName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* 悬停覆盖层 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 border-2 border-black flex items-center justify-center
                          opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all">
            <Leaf className="w-5 h-5 text-riso-green" />
          </div>
        </div>
        
        {/* 架构类型标签 */}
        <div className="absolute top-2 left-2 bg-riso-green text-white text-[10px] font-bold px-2 py-1 border border-black uppercase">
          {t(specimen.dna.growthArchitecture as any) || specimen.dna.growthArchitecture.replace('_', ' ')}
        </div>
        
        {/* 心情标签 */}
        <div className="absolute top-2 right-2 bg-riso-pink text-white text-[10px] font-bold px-2 py-1 border border-black uppercase">
          {t(specimen.dna.mood as any) || specimen.dna.mood}
        </div>

        {/* 内容指示器 */}
        <div className="absolute bottom-2 right-2 flex gap-1">
          <div className="bg-riso-black/80 text-white p-1 border border-white/30" title="Contains DNA">
            <Dna className="w-3 h-3" />
          </div>
          {hasMusic && (
            <div className="bg-riso-pink/90 text-white p-1 border border-white/30" title="Contains Music">
              <Music className="w-3 h-3" />
            </div>
          )}
          {hasVoice && (
            <div className="bg-riso-blue/90 text-white p-1 border border-white/30" title="Contains Voice">
              <MessageCircle className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
      
      {/* 信息区域 */}
      <div className="p-4 space-y-3">
        {/* 标题和创作者 */}
        <div>
          <h3 className="font-bold text-sm text-riso-black truncate group-hover:text-riso-green transition-colors">
            {specimen.dna.speciesName}
          </h3>
          <p className="text-xs text-gray-500 font-mono truncate">
            by {creatorName || 'Anonymous Botanist'}
          </p>
        </div>
        
        {/* DNA 特征 */}
        <div className="flex flex-wrap gap-1">
          <span className="bg-gray-100 text-gray-600 text-[9px] px-1.5 py-0.5 font-mono">
            {specimen.dna.leafShape}
          </span>
          <span className="bg-gray-100 text-gray-600 text-[9px] px-1.5 py-0.5 font-mono">
            E:{(specimen.dna.energy * 100).toFixed(0)}%
          </span>
          {genre && (
            <span className="bg-riso-blue/10 text-riso-blue text-[9px] px-1.5 py-0.5 font-mono">
              {genre}
            </span>
          )}
        </div>
        
        {/* 统计信息 */}
        <div className="flex items-center gap-3 text-[10px] text-gray-500 uppercase">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {soldShares} {t("market_stats_botanists")}
          </span>
        </div>
        
        {/* 价格和份额 */}
        <div className="border-t border-dashed border-gray-300 pt-3 uppercase">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-gray-400">{t("mint_price_per_share")}</span>
            <span className="font-bold text-riso-green flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {pricePerShare.toFixed(3)} ZETA
            </span>
          </div>
          
          {/* 份额进度条 */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500">{soldShares}/{totalShares} sold</span>
              <span className="text-riso-green font-bold">{availableShares} left</span>
            </div>
            <div className="h-2 bg-gray-200 border border-black overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-riso-green to-riso-blue transition-all"
                style={{ width: `${soldPercentage}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* 购买按钮 */}
        <button
          className="w-full py-2 bg-riso-black text-white font-bold text-xs uppercase
                     border-2 border-transparent hover:bg-riso-green hover:border-black
                     transition-all flex items-center justify-center gap-2"
        >
          <TrendingUp className="w-3 h-3" />
          {t("market_buy_btn_short")}
        </button>
      </div>
    </div>
  );
};

export default MusicCard;
