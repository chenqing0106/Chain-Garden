
export interface PlantDNA {
  speciesName: string;
  description: string;
  // Structural Logic
  growthArchitecture: 'fractal_tree' | 'organic_vine' | 'radial_succulent' | 'fern_frond' | 'weeping_willow' | 'alien_shrub' | 'crystal_cactus' | 'data_blossom';
  branchingFactor: number; // 2 to 5
  angleVariance: number; // How much angles deviate
  
  // Visuals
  colorPalette: string[]; // [Stem, Leaf_Main, Leaf_Highlight]
  leafShape: 'fern' | 'round' | 'needle' | 'abstract' | 'heart' | 'crystal';
  leafArrangement: 'alternate' | 'opposite' | 'whorled';
  
  growthSpeed: number; // Affects animation speed AND BPM

  // Vibe & Music Traits (New)
  mood: 'happy' | 'melancholic' | 'mysterious' | 'aggressive' | 'calm';
  energy: number; // 0.0 to 1.0 (Chaos factor)
}

export interface Specimen {
  id: string;
  dna: PlantDNA;
  prompt: string; // User input or "Manual"
  timestamp: number;
  imageData: string; // Base64 of the snapshot
  audioData?: string; // Base64 of the recorded generative music
  reflectionAudioData?: string; // Base64 of the user's voice reflection
  reflectionQuestion?: string; // The specific question answered
  // Blockchain Data
  txHash?: string;
  owner?: string;
  tokenId?: string;
  // Market Data (New)
  isListed?: boolean; // 是否公开上架
  pricePerShare?: number; // 每份价格 (ZETA)
  totalShares?: number; // 总份额
  soldShares?: number; // 已售份额
}

// 市场上架项目
export interface MarketListing {
  id: string;
  specimen: Specimen;
  creator: string; // 创作者地址
  creatorName?: string; // 创作者昵称
  pricePerShare: number; // 每份价格 (ZETA)
  totalShares: number; // 总份额
  soldShares: number; // 已售份额
  listedAt: number; // 上架时间
  genre?: string; // 音乐类型
  plays?: number; // 播放次数
}

// 支付链选项
export interface ChainOption {
  id: string;
  name: string;
  icon: string;
  symbol: string;
  disabled?: boolean;
  tooltip?: string;
}

// 购买记录
export interface PurchaseRecord {
  id: string;
  listingId: string;
  buyer: string;
  shares: number;
  totalPrice: number;
  chain: string; // 支付使用的链
  timestamp: number;
  txHash?: string;
}

export interface AudioSource {
  getFrequencyData(): { bass: number; mid: number; treble: number; raw: Uint8Array };
  cleanup?(): void;
}

export type LabState = 'EMPTY' | 'SYNTHESIZED' | 'GROWING';

export interface BioState {
  stress: number; // 0.0 to 1.0 (Misalignment / Distortion)
  energy: number; // 0.0 to 1.0 (Growth Rate / Note Density)
}
