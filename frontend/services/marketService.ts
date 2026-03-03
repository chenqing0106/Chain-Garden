import { MarketListing, Specimen, PlantDNA, PurchaseRecord, ChainOption } from '../types';

// 支持的支付链
export const CHAIN_OPTIONS: ChainOption[] = [
  { id: 'zetachain', name: 'ZetaChain', icon: '⚡', symbol: 'ZETA' },
  { id: 'ethereum', name: 'Ethereum', icon: '🔷', symbol: 'ETH' },
  { id: 'bsc', name: 'BNB Chain', icon: '🟡', symbol: 'BNB' },
  { id: 'polygon', name: 'Polygon', icon: '🟣', symbol: 'MATIC' },
  { id: 'bitcoin', name: 'Bitcoin', icon: '🟠', symbol: 'BTC', disabled: true, tooltip: 'Coming Soon' },
  { id: 'solana', name: 'Solana', icon: '🟢', symbol: 'SOL', disabled: true, tooltip: 'Coming Soon' },
];

// 模拟创作者名字
const CREATOR_NAMES = [
  'PlantWhisperer.eth', 'DigitalBotanist', 'SeedMaster', 'GreenThumb', 
  'FloraCreator', 'ChainGardener', 'NFTBotanist', 'AudioFlora'
];

// 植物类型分类
const GENRES = ['Tree', 'Vine', 'Succulent', 'Fern', 'Willow', 'Exotic', 'Crystal', 'Data'];

// 生成模拟的植物DNA
function generateMockDNA(): PlantDNA {
  const architectures: PlantDNA['growthArchitecture'][] = [
    'fractal_tree', 'organic_vine', 'radial_succulent', 'fern_frond', 
    'weeping_willow', 'alien_shrub', 'crystal_cactus', 'data_blossom'
  ];
  const moods: PlantDNA['mood'][] = ['happy', 'melancholic', 'mysterious', 'aggressive', 'calm'];
  const leafShapes: PlantDNA['leafShape'][] = ['fern', 'round', 'needle', 'abstract', 'heart', 'crystal'];
  
  const speciesNames = [
    'Ethereal Harmonics', 'Digital Bloom', 'Sonic Fern', 'Bass Blossom',
    'Rhythm Tree', 'Melody Vine', 'Beat Crystal', 'Frequency Flora',
    'Ambient Willow', 'Synth Succulent', 'Echo Shrub', 'Pulse Petal'
  ];

  const colorPalettes = [
    ['#1a1a2e', '#16213e', '#0f3460'],
    ['#2d132c', '#801336', '#c72c41'],
    ['#0a0a0a', '#1a1a2e', '#9d4edd'],
    ['#006d77', '#83c5be', '#edf6f9'],
    ['#3d5a80', '#98c1d9', '#e0fbfc'],
    ['#ff6b6b', '#ffd93d', '#6bcb77'],
  ];

  return {
    speciesName: speciesNames[Math.floor(Math.random() * speciesNames.length)],
    description: 'A unique digital specimen generated from audio frequencies.',
    growthArchitecture: architectures[Math.floor(Math.random() * architectures.length)],
    branchingFactor: 2 + Math.random() * 3,
    angleVariance: 15 + Math.random() * 45,
    colorPalette: colorPalettes[Math.floor(Math.random() * colorPalettes.length)],
    leafShape: leafShapes[Math.floor(Math.random() * leafShapes.length)],
    leafArrangement: ['alternate', 'opposite', 'whorled'][Math.floor(Math.random() * 3)] as any,
    growthSpeed: 0.5 + Math.random() * 2,
    mood: moods[Math.floor(Math.random() * moods.length)],
    energy: Math.random(),
  };
}

// 生成模拟图片 (SVG placeholder)
function generatePlaceholderImage(colors: string[]): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${colors[1]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors[2]};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#grad)"/>
      <circle cx="200" cy="200" r="80" fill="${colors[1]}" opacity="0.3"/>
      <circle cx="200" cy="200" r="40" fill="${colors[2]}" opacity="0.5"/>
      <text x="200" y="200" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="monospace" font-size="48">*</text>
      <text x="200" y="370" text-anchor="middle" fill="white" font-family="monospace" font-size="12">Music NFT</text>
    </svg>
  `;
  // 使用 encodeURIComponent 而不是 btoa 来避免 unicode 问题
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// 生成模拟市场列表
function generateMockListings(count: number): MarketListing[] {
  const listings: MarketListing[] = [];
  
  for (let i = 0; i < count; i++) {
    const dna = generateMockDNA();
    const totalShares = [100, 500, 1000, 2000][Math.floor(Math.random() * 4)];
    const soldShares = Math.floor(Math.random() * totalShares * 0.7);
    
    const specimen: Specimen = {
      id: `mock-${Date.now()}-${i}`,
      dna,
      prompt: `Generated from ${['ambient', 'electronic', 'experimental', 'chill'][Math.floor(Math.random() * 4)]} vibes`,
      timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // 过去7天内
      imageData: generatePlaceholderImage(dna.colorPalette),
      audioData: undefined, // 模拟数据不包含实际音频
      isListed: true,
      pricePerShare: 0.01 + Math.random() * 0.49,
      totalShares,
      soldShares,
    };

    listings.push({
      id: `listing-${i}`,
      specimen,
      creator: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      creatorName: CREATOR_NAMES[Math.floor(Math.random() * CREATOR_NAMES.length)],
      pricePerShare: specimen.pricePerShare!,
      totalShares,
      soldShares,
      listedAt: specimen.timestamp,
      genre: GENRES[Math.floor(Math.random() * GENRES.length)],
      plays: Math.floor(Math.random() * 1000),
    });
  }
  
  return listings;
}

// 本地存储键
const MARKET_STORAGE_KEY = 'chain_garden_market';
const PURCHASES_STORAGE_KEY = 'chain_garden_purchases';

class MarketService {
  private listings: MarketListing[] = [];
  private purchases: PurchaseRecord[] = [];
  private initialized = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedListings = localStorage.getItem(MARKET_STORAGE_KEY);
      const storedPurchases = localStorage.getItem(PURCHASES_STORAGE_KEY);
      
      if (storedListings) {
        const parsed = JSON.parse(storedListings);
        // 验证数据格式
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.listings = parsed;
        } else {
          throw new Error('Invalid listings data');
        }
      } else {
        // 初始化模拟数据
        this.listings = generateMockListings(12);
        this.saveListings();
      }
      
      if (storedPurchases) {
        const parsedPurchases = JSON.parse(storedPurchases);
        if (Array.isArray(parsedPurchases)) {
          this.purchases = parsedPurchases;
        }
      }
      
      this.initialized = true;
    } catch (e) {
      console.warn('Resetting market data due to error:', e);
      // 清除可能损坏的数据
      localStorage.removeItem(MARKET_STORAGE_KEY);
      localStorage.removeItem(PURCHASES_STORAGE_KEY);
      // 重新生成模拟数据
      this.listings = generateMockListings(12);
      this.purchases = [];
      this.saveListings();
      this.initialized = true;
    }
  }

  private saveListings() {
    try {
      localStorage.setItem(MARKET_STORAGE_KEY, JSON.stringify(this.listings));
    } catch (e) {
      console.error('Failed to save listings:', e);
    }
  }

  private savePurchases() {
    try {
      localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(this.purchases));
    } catch (e) {
      console.error('Failed to save purchases:', e);
    }
  }

  // 获取所有公开上架的作品
  getAllListings(): MarketListing[] {
    return [...this.listings].sort((a, b) => b.listedAt - a.listedAt);
  }

  // 按类型筛选
  getListingsByGenre(genre: string): MarketListing[] {
    return this.listings.filter(l => l.genre === genre);
  }

  // 搜索
  searchListings(query: string): MarketListing[] {
    const q = query.toLowerCase();
    return this.listings.filter(l => 
      l.specimen.dna.speciesName.toLowerCase().includes(q) ||
      l.creatorName?.toLowerCase().includes(q) ||
      l.genre?.toLowerCase().includes(q)
    );
  }

  // 获取单个作品详情
  getListing(id: string): MarketListing | undefined {
    return this.listings.find(l => l.id === id);
  }

  // 上架作品 (创作者操作)
  listSpecimen(specimen: Specimen, pricePerShare: number, totalShares: number, creator: string, creatorName?: string): MarketListing {
    const listing: MarketListing = {
      id: `listing-${Date.now()}`,
      specimen: {
        ...specimen,
        isListed: true,
        pricePerShare,
        totalShares,
        soldShares: 0,
      },
      creator,
      creatorName,
      pricePerShare,
      totalShares,
      soldShares: 0,
      listedAt: Date.now(),
      genre: GENRES[Math.floor(Math.random() * GENRES.length)],
      plays: 0,
    };
    
    this.listings.unshift(listing);
    this.saveListings();
    return listing;
  }

  // 购买份额 (粉丝操作)
  async purchaseShares(
    listingId: string, 
    shares: number, 
    buyer: string, 
    chain: string
  ): Promise<PurchaseRecord> {
    const listing = this.listings.find(l => l.id === listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }
    
    const availableShares = listing.totalShares - listing.soldShares;
    if (shares > availableShares) {
      throw new Error('Not enough shares available');
    }
    
    const totalPrice = shares * listing.pricePerShare;
    
    // 模拟交易延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 更新已售份额
    listing.soldShares += shares;
    listing.specimen.soldShares = listing.soldShares;
    this.saveListings();
    
    // 记录购买
    const record: PurchaseRecord = {
      id: `purchase-${Date.now()}`,
      listingId,
      buyer,
      shares,
      totalPrice,
      chain,
      timestamp: Date.now(),
      txHash: `0x${Math.random().toString(16).slice(2)}`, // 模拟txHash
    };
    
    this.purchases.push(record);
    this.savePurchases();
    
    return record;
  }

  // 获取用户的购买记录
  getUserPurchases(buyer: string): PurchaseRecord[] {
    return this.purchases.filter(p => p.buyer.toLowerCase() === buyer.toLowerCase());
  }

  // 获取用户持有的份额
  getUserHoldings(buyer: string): { listing: MarketListing; shares: number }[] {
    const purchases = this.getUserPurchases(buyer);
    const holdingsMap = new Map<string, number>();
    
    purchases.forEach(p => {
      const current = holdingsMap.get(p.listingId) || 0;
      holdingsMap.set(p.listingId, current + p.shares);
    });
    
    const holdings: { listing: MarketListing; shares: number }[] = [];
    holdingsMap.forEach((shares, listingId) => {
      const listing = this.getListing(listingId);
      if (listing) {
        holdings.push({ listing, shares });
      }
    });
    
    return holdings;
  }

  // 获取热门作品 (按销量排序)
  getTrending(limit: number = 6): MarketListing[] {
    return [...this.listings]
      .sort((a, b) => b.soldShares - a.soldShares)
      .slice(0, limit);
  }

  // 获取最新上架
  getLatest(limit: number = 6): MarketListing[] {
    return [...this.listings]
      .sort((a, b) => b.listedAt - a.listedAt)
      .slice(0, limit);
  }

  // 清除所有数据 (开发用)
  clearAll() {
    this.listings = generateMockListings(12);
    this.purchases = [];
    this.saveListings();
    this.savePurchases();
  }
}

// 导出单例
export const marketService = new MarketService();
export { GENRES };

